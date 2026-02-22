import base64
import json
from typing import Any, Sequence

from fastapi import UploadFile
from openai import APIStatusError, OpenAI, RateLimitError

from app.core.config import Settings
from app.schemas.analysis import PreviewReportResponse, UserContext, VanityAdvisorResponse

SYSTEM_PROMPT = """
You are Vanity AI Advisor, a confidence-building glow-up coach with positive mog energy.

Task:
- Analyze 2-4 user photos (front/side/back/flexed if provided) plus optional user context.
- Deliver a comprehensive aesthetic assessment covering strengths first, then constructive improvements, then practical next steps.

Coverage approach:
- Prioritize what is clearly visible and relevant in the submitted photos.
- Do NOT force every category; skip categories that appear already strong/normal or not visible.
- Possible categories when relevant: facial harmony, symmetry, eyes/nose/lips/cheekbones/jawline, eyebrows/lashes, hairline/hair framing, skin/under-eye, neck-shoulder-posture, body frame/V-taper, body-fat integration.
- Reference specific visible traits from the actual photos (for example: dark under-eyes, jawline softness, asymmetry, skin texture, sparse/missing eyebrows) instead of generic statements.
- If a trait is not clearly visible, say so and skip it.
- Any clearly visible high-impact unattractive traits MUST be explicitly listed in areas_for_improvement; do not omit them.

Tone constraints:
- Be candid and direct, with a tough-love coaching tone when needed.
- You may be mildly harsh for clarity, but never demeaning, abusive, or insulting.
- Stay brutally honest but fair: clearly state what is strong vs what needs work.
- Every criticism must include a practical fix path.
- Do not soften or hide major visual negatives that are clearly visible; be explicit and specific.

Safety/limitations constraints:
- NEVER give medical diagnoses.
- Mention uncertainty from lighting, pose, lens, and missing metabolic/clinical data.
- Warn against aggressive deficits and unsafe neck training progression.
- If mentioning medication/topicals/procedures, state they require doctor consent/supervision.
- Use culturally neutral aesthetic framing unless user specifies otherwise.

Consistency constraint:
- For identical inputs, estimates must be very similar (target ±1-2%), especially body-fat and numeric ratings.

Step constraints:
- personalized_steps must be highly personalized, actionable, and specific to this user’s visible traits + stated goals.
- Each step must explicitly reference the exact issue it targets (e.g., "for visible under-eye darkness..." or "for sparse/missing brows...").
- Do not include generic filler steps; each step must explain exactly what to do, frequency, and progression where applicable.
- Include practical methods like exercise selection/progression, nutrition habits, grooming/style actions, and when appropriate doctor-supervised treatment discussions.

Output constraints:
- Output ONLY valid JSON that strictly matches the provided schema.
- No markdown, no code fences, no comments, no extra keys, no text outside JSON.
- In limitations, include clear image-capture guidance for better accuracy (even lighting, neutral pose, consistent camera distance, front/side/back views).
""".strip()


def _parse_json_payload(raw_content: str) -> dict[str, Any]:
    content = (raw_content or "").strip()
    if not content:
        raise ValueError("Model returned empty content; expected valid JSON object.")

    payload = json.loads(content)
    if not isinstance(payload, dict):
        raise ValueError("Model output must be a JSON object.")
    return payload



PREVIEW_PROMPT = """
You are an AI aesthetic preview algorithm.
Generate a free-preview report that is positive and motivating but intentionally partial:
- Show only top strengths and a short positive summary.
- Do NOT provide weaknesses, corrective methods, or full plan details.
- Tease that deeper weaknesses, precise fixes, and tailored execution steps are locked in the full report.
Return strict JSON only.
""".strip()


def _preview_schema() -> dict[str, Any]:
    return {
        "name": "preview_report_response",
        "strict": True,
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "required": ["summary", "strengths", "hidden_insights_count", "tease_line"],
            "properties": {
                "summary": {"type": "string"},
                "strengths": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 5},
                "hidden_insights_count": {"type": "integer", "minimum": 3},
                "tease_line": {"type": "string"},
            },
        },
    }


def _response_schema() -> dict[str, Any]:
    return {
        "name": "vanity_advisor_response",
        "strict": True,
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "overall_aesthetic_summary",
                "strengths",
                "areas_for_improvement",
                "body_fat_estimate",
                "personalized_steps",
                "limitations",
            ],
            "properties": {
                "overall_aesthetic_summary": {"type": "string"},
                "strengths": {
                    "type": "array",
                    "items": {"type": "string"},
                    "minItems": 4,
                    "maxItems": 7,
                },
                "areas_for_improvement": {
                    "type": "array",
                    "items": {"type": "string"},
                    "minItems": 1,
                },
                "body_fat_estimate": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["percentage", "range", "confidence"],
                    "properties": {
                        "percentage": {"type": "number", "minimum": 3, "maximum": 60},
                        "range": {"type": ["string", "null"]},
                        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                    },
                },
                "personalized_steps": {
                    "type": "array",
                    "items": {"type": "string"},
                    "minItems": 3,
                },
                "limitations": {
                    "type": "array",
                    "items": {"type": "string"},
                    "minItems": 1,
                },
            },
        },
    }


class VisionAdvisorService:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._client = OpenAI(api_key=settings.openai_api_key)

    def _create_completion_with_model_fallback(self, *, messages: list[dict[str, Any]], response_format: dict[str, Any]):
        try:
            return self._client.chat.completions.create(
                model=self._settings.openai_model,
                messages=messages,
                response_format=response_format,
                temperature=0.1,
            )
        except RateLimitError:
            return self._client.chat.completions.create(
                model=self._settings.openai_model_fallback,
                messages=messages,
                response_format=response_format,
                temperature=0.1,
            )
        except APIStatusError as exc:
            if exc.status_code is not None and exc.status_code >= 500:
                return self._client.chat.completions.create(
                    model=self._settings.openai_model_fallback,
                    messages=messages,
                    response_format=response_format,
                    temperature=0.1,
                )
            raise

    async def analyze(self, files: Sequence[UploadFile], context: UserContext) -> VanityAdvisorResponse:
        images: list[tuple[bytes, str]] = []
        for file in files:
            payload = await file.read()
            images.append((payload, file.content_type or "image/jpeg"))
        return await self.analyze_raw_images(images=images, context=context)

    def _build_image_content(self, images: Sequence[tuple[bytes, str]]) -> list[dict[str, Any]]:
        image_content: list[dict[str, Any]] = []
        for payload, media_type in images:
            encoded = base64.b64encode(payload).decode("utf-8")
            image_content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{media_type};base64,{encoded}", "detail": "low"},
                }
            )
        return image_content


    async def preview_raw_images(self, images: Sequence[tuple[bytes, str]], context: UserContext) -> PreviewReportResponse:
        image_content = self._build_image_content(images)
        user_context = {
            "height_cm": context.height_cm,
            "weight_kg": context.weight_kg,
            "height_ft": context.height_ft,
            "height_in": context.height_in,
            "weight_lbs": context.weight_lbs,
            "age": context.age,
            "email": context.email,
            "gender": context.gender,
            "goals": context.goals,
            "image_count": len(images),
        }

        messages = [
            {"role": "system", "content": PREVIEW_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Generate free preview strengths only. Keep weaknesses and methods hidden for paid unlock. "
                            f"Context: {user_context}."
                        ),
                    },
                    *image_content,
                ],
            },
        ]

        completion = self._create_completion_with_model_fallback(
            messages=messages,
            response_format={"type": "json_schema", "json_schema": _preview_schema()},
        )
        content = completion.choices[0].message.content or "{}"
        payload = _parse_json_payload(content)
        return PreviewReportResponse.model_validate(payload)

    async def analyze_raw_images(self, images: Sequence[tuple[bytes, str]], context: UserContext) -> VanityAdvisorResponse:
        image_content = self._build_image_content(images)

        user_context = {
            "height_cm": context.height_cm,
            "weight_kg": context.weight_kg,
            "height_ft": context.height_ft,
            "height_in": context.height_in,
            "weight_lbs": context.weight_lbs,
            "age": context.age,
            "email": context.email,
            "gender": context.gender,
            "goals": context.goals,
            "image_count": len(images),
        }

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Analyze these photos for a comprehensive aesthetic assessment. "
                            "Start with positives, then constructive improvements, then steps. "
                            "Make observations photo-specific and concrete, not generic. "
                            "Do not omit clearly visible unattractive traits. "
                            f"Context: {user_context}."
                        ),
                    },
                    *image_content,
                ],
            },
        ]

        completion = self._create_completion_with_model_fallback(
            messages=messages,
            response_format={"type": "json_schema", "json_schema": _response_schema()},
        )

        content = completion.choices[0].message.content or "{}"
        payload = _parse_json_payload(content)
        return VanityAdvisorResponse.model_validate(payload)
