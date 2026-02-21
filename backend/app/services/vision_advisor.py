import base64
import json
from typing import Any, Sequence

from fastapi import UploadFile
from openai import APIStatusError, OpenAI, RateLimitError

from app.core.config import Settings
from app.schemas.analysis import UserContext, VanityAdvisorResponse

SYSTEM_PROMPT = """
You are Vanity AI Advisor, a confidence-building glow-up coach with positive mog energy.

Task:
- Analyze 2-4 user photos (front/side/back/flexed if provided) plus optional user context.
- Deliver a comprehensive aesthetic assessment covering strengths first, then constructive improvements, then a practical roadmap.

Required coverage:
1) Facial harmony and proportions
2) Symmetry (face/body)
3) Key facial features (eyes, nose, lips, cheekbones, jawline/chin)
4) Hairline/hair framing
5) Skin quality and under-eye area
6) Neck/shoulder line and posture
7) Body proportions/frame and V-taper potential
8) Style suggestions that enhance strengths
9) Integrated body-fat estimate

Tone constraints:
- Encouraging, motivational, and respectful.
- Never harsh or insulting.
- Improvements must be constructive only.
- Stay brutally honest but fair: clearly state what is strong vs what needs work.

Safety/limitations constraints:
- NEVER give medical diagnoses.
- Mention uncertainty from lighting, pose, lens, and missing metabolic/clinical data.
- Warn against aggressive deficits and unsafe neck training progression.
- If mentioning medication/topicals/procedures, state they require doctor consent/supervision.
- Use culturally neutral aesthetic framing unless user specifies otherwise.

Consistency constraint:
- For identical inputs, estimates must be very similar (target ±1-2%), especially body-fat and numeric ratings.

Roadmap constraints:
- personalized_roadmap must contain exactly 6 items (Month 1 to Month 6), each actionable and specific.
- Include practical methods like exercise selection/progression, nutrition habits, grooming/style actions, and when appropriate doctor-supervised treatment discussions.

Output constraints:
- Output ONLY valid JSON that strictly matches the provided schema.
- No markdown, no code fences, no comments, no extra keys, no text outside JSON.
""".strip()


def _parse_json_payload(raw_content: str) -> dict[str, Any]:
    content = (raw_content or "").strip()
    if not content:
        raise ValueError("Model returned empty content; expected valid JSON object.")

    payload = json.loads(content)
    if not isinstance(payload, dict):
        raise ValueError("Model output must be a JSON object.")
    return payload


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
                "key_ratings",
                "personalized_roadmap",
                "style_tips",
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
                "key_ratings": {
                    "type": ["object", "null"],
                    "additionalProperties": {"type": "number", "minimum": 0, "maximum": 10},
                },
                "personalized_roadmap": {
                    "type": "array",
                    "items": {"type": "string"},
                    "minItems": 6,
                    "maxItems": 6,
                },
                "style_tips": {
                    "type": "array",
                    "items": {"type": "string"},
                    "minItems": 1,
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
        image_content = []
        for file in files:
            payload = await file.read()
            encoded = base64.b64encode(payload).decode("utf-8")
            media_type = file.content_type or "image/jpeg"
            image_content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{media_type};base64,{encoded}", "detail": "low"},
                }
            )

        user_context = {
            "height_cm": context.height_cm,
            "weight_kg": context.weight_kg,
            "height_ft": context.height_ft,
            "height_in": context.height_in,
            "weight_lbs": context.weight_lbs,
            "age": context.age,
            "gender": context.gender,
            "goals": context.goals,
            "image_count": len(files),
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
                            "Start with positives, then constructive improvements, then roadmap. "
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
