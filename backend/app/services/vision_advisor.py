import base64
import json
from typing import Any, Sequence

from fastapi import UploadFile
from openai import APIStatusError, BadRequestError, OpenAI, RateLimitError

from app.core.config import Settings
from app.schemas.analysis import UserContext, VanityAdvisorResponse

SYSTEM_PROMPT = """
You are Vanity AI Advisor, a confidence-building, glow-up focused aesthetics coach with positive “mog energy”.

Primary response style:
- Start with positives first: highlight 4-7 attractive/strong features before improvements.
- Then provide constructive, kind improvements.
- Then provide a practical 3-6 month roadmap.
- Tone must be motivating, respectful, and never insulting.

Coverage requirements (assess as visible; if uncertain, say so):
1) Facial harmony & proportions (facial thirds, balance, FWHR/golden-ratio vibes when visible)
2) Symmetry (face and body)
3) Features: eyes, nose, lips, cheekbones, jawline/chin
4) Hairline / hair framing
5) Skin quality/clarity and peri-orbital appearance
6) Neck and shoulder line
7) Overall frame/proportions and V-taper potential
8) Posture and posing tips
9) Brief style/fashion suggestions
10) Body-fat estimate integrated into overall aesthetic impression

Safety and limitations (non-negotiable):
- NEVER provide medical diagnoses.
- ALWAYS include this exact disclaimer text in `disclaimer`:
  "This is visual estimation only, not a substitute for DEXA/calipers/doctor. Consult professionals for health concerns."
- Include warning language about neck-training injury risk and aggressive caloric deficits.
- Mention uncertainty from lighting/pose/camera angle/lens and missing metabolic/lab data.
- Use culturally neutral aesthetic ideals unless user explicitly requests otherwise.

Consistency requirement:
- For identical images, give very similar body-fat and numeric estimates (target ±1-2%). Be consistent and precise.

Return strict JSON only matching the requested schema.
""".strip()

REQUIRED_DISCLAIMER = (
    "This is visual estimation only, not a substitute for DEXA/calipers/doctor. "
    "Consult professionals for health concerns."
)


def _response_schema() -> dict[str, Any]:
    confidence_enum = ["low", "medium", "high"]
    rating_schema = {
        "type": "object",
        "additionalProperties": {"type": "number", "minimum": 0, "maximum": 10},
        "minProperties": 6,
    }

    return {
        "name": "vanity_aesthetic_assessment",
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
                "safety_notes",
                "disclaimer",
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
                    "minItems": 3,
                },
                "body_fat_estimate": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["percentage", "confidence", "range"],
                    "properties": {
                        "percentage": {"type": ["number", "null"], "minimum": 3, "maximum": 60},
                        "confidence": {"type": "string", "enum": confidence_enum},
                        "range": {"type": "string"},
                    },
                },
                "key_ratings": rating_schema,
                "personalized_roadmap": {
                    "type": "array",
                    "items": {"type": "string"},
                    "minItems": 3,
                },
                "style_tips": {"type": "array", "items": {"type": "string"}},
                "safety_notes": {"type": "string"},
                "disclaimer": {"type": "string", "enum": [REQUIRED_DISCLAIMER]},
                "limitations": {"type": "array", "items": {"type": "string"}},
            },
        },
        "strict": True,
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
            # We default to low detail for lower latency/cost/token usage;
            # trade-off: reduced fidelity can miss subtle eyebrow hair density,
            # skin texture, or fine posture cues versus auto/high detail.
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
                            "Assess all visible areas from face to frame/body proportions and posture. "
                            "Start with positives, then improvements, then roadmap. "
                            f"Context: {user_context}."
                        ),
                    },
                    *image_content,
                ],
            },
        ]

        try:
            completion = self._create_completion_with_model_fallback(
                messages=messages,
                response_format={"type": "json_schema", "json_schema": _response_schema()},
            )
            content = completion.choices[0].message.content or "{}"
        except BadRequestError:
            completion = self._create_completion_with_model_fallback(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            f"{SYSTEM_PROMPT}\n"
                            "Return strictly valid JSON with exactly these keys: "
                            "overall_aesthetic_summary, strengths, areas_for_improvement, "
                            "body_fat_estimate, key_ratings, personalized_roadmap, style_tips, "
                            "safety_notes, disclaimer, limitations. "
                            f"disclaimer must equal: {REQUIRED_DISCLAIMER}"
                        ),
                    },
                    messages[1],
                ],
                response_format={"type": "json_object"},
            )
            content = completion.choices[0].message.content or "{}"

        payload = json.loads(content)
        return VanityAdvisorResponse.model_validate(payload)
