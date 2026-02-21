from collections.abc import Sequence

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.schemas.analysis import UserContext, VanityAdvisorResponse
from app.services.vision_advisor import VisionAdvisorService

router = APIRouter(prefix="/api/v1", tags=["analysis"])


def _validate_files(files: Sequence[UploadFile], settings: Settings) -> None:
    if len(files) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload at least 2 photos (front + side minimum).",
        )

    if len(files) > settings.max_images:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Upload at most {settings.max_images} images.",
        )

    max_bytes = settings.max_image_size_mb * 1024 * 1024
    for item in files:
        if item.content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported content type: {item.content_type}",
            )

        if item.size and item.size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File {item.filename} exceeds {settings.max_image_size_mb}MB.",
            )


def _coerce_metric_inputs(
    *,
    height_cm: float | None,
    weight_kg: float | None,
    height_ft: int | None,
    height_in: int | None,
    weight_lbs: float | None,
) -> tuple[float | None, float | None]:
    normalized_height_cm = height_cm
    normalized_weight_kg = weight_kg

    if height_cm is None and height_ft is not None:
        normalized_height_cm = round(((height_ft * 12) + (height_in or 0)) * 2.54, 1)

    if weight_kg is None and weight_lbs is not None:
        normalized_weight_kg = round(weight_lbs * 0.45359237, 1)

    return normalized_height_cm, normalized_weight_kg


@router.post("/analyze", response_model=VanityAdvisorResponse)
async def analyze_images(
    images: list[UploadFile] = File(..., description="2-4 physique photos"),
    height_cm: float | None = Form(default=None),
    weight_kg: float | None = Form(default=None),
    height_ft: int | None = Form(default=None),
    height_in: int | None = Form(default=None),
    weight_lbs: float | None = Form(default=None),
    age: int | None = Form(default=None),
    gender: str | None = Form(default=None),
    goals: str | None = Form(default=None),
    settings: Settings = Depends(get_settings),
) -> VanityAdvisorResponse:
    _validate_files(images, settings)
    normalized_height_cm, normalized_weight_kg = _coerce_metric_inputs(
        height_cm=height_cm,
        weight_kg=weight_kg,
        height_ft=height_ft,
        height_in=height_in,
        weight_lbs=weight_lbs,
    )

    context = UserContext(
        height_cm=normalized_height_cm,
        weight_kg=normalized_weight_kg,
        height_ft=height_ft,
        height_in=height_in,
        weight_lbs=weight_lbs,
        age=age,
        gender=gender,
        goals=goals,
    )
    service = VisionAdvisorService(settings)
    return await service.analyze(images, context)
