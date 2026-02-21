from collections.abc import Sequence

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.schemas.analysis import UserContext, VanityAdvisorResponse
from app.services.vision_advisor import VisionAdvisorService

router = APIRouter(prefix="/api/v1", tags=["analysis"])


def _validate_files(files: Sequence[UploadFile], settings: Settings) -> None:
    if not (2 <= len(files) <= settings.max_images):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Upload between 2 and {settings.max_images} images.",
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


@router.post("/analyze", response_model=VanityAdvisorResponse)
async def analyze_images(
    images: list[UploadFile] = File(..., description="2-4 physique photos"),
    height_cm: float | None = Form(default=None),
    weight_kg: float | None = Form(default=None),
    age: int | None = Form(default=None),
    gender: str | None = Form(default=None),
    goals: str | None = Form(default=None),
    settings: Settings = Depends(get_settings),
) -> VanityAdvisorResponse:
    _validate_files(images, settings)

    context = UserContext(
        height_cm=height_cm,
        weight_kg=weight_kg,
        age=age,
        gender=gender,
        goals=goals,
    )
    service = VisionAdvisorService(settings)
    return await service.analyze(images, context)
