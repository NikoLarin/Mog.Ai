import json
import shutil
import uuid
from collections.abc import Sequence
from pathlib import Path

import stripe
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status

from app.core.config import Settings, get_settings
from app.schemas.analysis import (
    AnalyzePaidRequest,
    CreateCheckoutRequest,
    CreateCheckoutResponse,
    PreparedScanResponse,
    PreviewReportResponse,
    UserContext,
    VanityAdvisorResponse,
)
from app.services.vision_advisor import VisionAdvisorService

router = APIRouter(prefix="/api/v1", tags=["analysis"])
SCAN_STORAGE = Path("/tmp/mog_scans")


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
    total_bytes = 0
    for item in files:
        if item.content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported content type: {item.content_type}",
            )

        size = item.size or 0
        total_bytes += size
        if size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File {item.filename} exceeds {settings.max_image_size_mb}MB.",
            )

    if total_bytes > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Total upload size exceeds 20MB limit.",
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


def _scan_dir(scan_id: str) -> Path:
    return SCAN_STORAGE / scan_id


@router.post("/scans/prepare", response_model=PreparedScanResponse)
async def prepare_scan(
    images: list[UploadFile] = File(..., description="2-4 physique photos"),
    email: str | None = Form(default=None),
    height_cm: float | None = Form(default=None),
    weight_kg: float | None = Form(default=None),
    height_ft: int | None = Form(default=None),
    height_in: int | None = Form(default=None),
    weight_lbs: float | None = Form(default=None),
    age: int | None = Form(default=None),
    gender: str | None = Form(default=None),
    goals: str | None = Form(default=None),
    settings: Settings = Depends(get_settings),
) -> PreparedScanResponse:
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
        email=email,
        gender=gender,
        goals=goals,
    )

    SCAN_STORAGE.mkdir(parents=True, exist_ok=True)
    scan_id = uuid.uuid4().hex
    folder = _scan_dir(scan_id)
    folder.mkdir(parents=True, exist_ok=False)

    try:
        image_manifest: list[dict[str, str]] = []
        for idx, file in enumerate(images):
            payload = await file.read()
            suffix = ".jpg"
            if file.content_type == "image/png":
                suffix = ".png"
            elif file.content_type == "image/webp":
                suffix = ".webp"

            filename = f"img_{idx}{suffix}"
            target = folder / filename
            target.write_bytes(payload)
            image_manifest.append({"filename": filename, "content_type": file.content_type or "image/jpeg"})

        (folder / "context.json").write_text(context.model_dump_json())
        (folder / "images.json").write_text(json.dumps(image_manifest))
    except Exception:
        shutil.rmtree(folder, ignore_errors=True)
        raise

    return PreparedScanResponse(scan_id=scan_id, image_count=len(images), message="Preview ready. Unlock analysis to continue.")


@router.get("/scans/{scan_id}/preview", response_model=PreviewReportResponse)
async def preview_scan(scan_id: str, settings: Settings = Depends(get_settings)) -> PreviewReportResponse:
    folder = _scan_dir(scan_id)
    if not folder.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prepared scan not found or expired.")

    context = UserContext.model_validate_json((folder / "context.json").read_text())
    images_info = json.loads((folder / "images.json").read_text())

    images: list[tuple[bytes, str]] = []
    for item in images_info:
        raw = (folder / item["filename"]).read_bytes()
        images.append((raw, item["content_type"]))

    service = VisionAdvisorService(settings)
    return await service.preview_raw_images(images=images, context=context)



@router.post("/payments/create-checkout", response_model=CreateCheckoutResponse)
async def create_checkout(payload: CreateCheckoutRequest, settings: Settings = Depends(get_settings)) -> CreateCheckoutResponse:
    scan_folder = _scan_dir(payload.scan_id)
    if not scan_folder.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prepared scan not found.")

    try:
        context = UserContext.model_validate_json((scan_folder / "context.json").read_text())
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prepared scan context is invalid.") from exc

    stripe.api_key = settings.stripe_secret_key

    try:
        checkout_payload: dict[str, object] = {
            "mode": "payment",
            success_url = "https://mog-ai.vercel.app/scan/success?session_id={CHECKOUT_SESSION_ID}&scan_id={scan_id}"
            cancel_url = "https://mog-ai.vercel.app/upload"  # or your cancel page
            "client_reference_id": payload.scan_id,
            "metadata": {"scan_id": payload.scan_id},
            "line_items": [
                {
                    "quantity": 1,
                    "price_data": {
                        "currency": settings.stripe_currency,
                        "unit_amount": settings.stripe_scan_price_cents,
                        "product_data": {"name": "Mog.Ai Full Vanity Scan"},
                    },
                }
            ],
        }
        if context.email:
            checkout_payload["customer_email"] = context.email
            checkout_payload["metadata"] = {"scan_id": payload.scan_id, "email": context.email}

        session = stripe.checkout.Session.create(**checkout_payload)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Stripe checkout creation failed: {exc}") from exc

    return CreateCheckoutResponse(session_id=session.id, publishable_key=settings.stripe_publishable_key)


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, settings: Settings = Depends(get_settings)) -> dict[str, bool]:
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe webhook secret not configured.")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Stripe signature header.")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid webhook payload: {exc}") from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid webhook signature: {exc}") from exc

    if event.get("type") == "checkout.session.completed":
        session = event.get("data", {}).get("object", {})
        scan_id = (session.get("metadata") or {}).get("scan_id") or session.get("client_reference_id")
        if scan_id:
            print(f"[stripe webhook] checkout.session.completed for scan_id={scan_id}")

    return {"received": True}

@router.post("/analyze-paid", response_model=VanityAdvisorResponse)
async def analyze_paid(payload: AnalyzePaidRequest, settings: Settings = Depends(get_settings)) -> VanityAdvisorResponse:
    folder = _scan_dir(payload.scan_id)
    if not folder.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prepared scan not found or expired.")

    stripe.api_key = settings.stripe_secret_key
    try:
        session = stripe.checkout.Session.retrieve(payload.stripe_session_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid Stripe session: {exc}") from exc

    if session.payment_status != "paid":
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Payment not completed.")

    session_scan_id = (session.metadata or {}).get("scan_id") or session.client_reference_id
    if session_scan_id != payload.scan_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment session does not match prepared scan.")

    context = UserContext.model_validate_json((folder / "context.json").read_text())
    images_info = json.loads((folder / "images.json").read_text())

    images: list[tuple[bytes, str]] = []
    for item in images_info:
        raw = (folder / item["filename"]).read_bytes()
        images.append((raw, item["content_type"]))

    service = VisionAdvisorService(settings)
    result = await service.analyze_raw_images(images=images, context=context)

    shutil.rmtree(folder, ignore_errors=True)
    return result


@router.post("/analyze", response_model=VanityAdvisorResponse)
async def analyze_direct_blocked() -> VanityAdvisorResponse:
    raise HTTPException(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        detail="Direct analysis is gated. Prepare scan and complete payment first.",
    )
