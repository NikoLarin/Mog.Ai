import base64
import json
from typing import Any, Sequence

from fastapi import UploadFile
from openai import APIStatusError, BadRequestError, OpenAI, RateLimitError

from app.core.config import Settings
from app.schemas.analysis import UserContext, VanityAdvisorResponse

SYSTEM_PROMPT = """
You are Vanity AI Advisor, a strict but respectful visual aesthetics coach.

Non-negotiable rules in every response:
1) NEVER provide medical diagnosis.
2) ALWAYS include this exact disclaimer text in safety_and_limitations.disclaimer:
   \"This is visual estimation only, not a substitute for DEXA/calipers/doctor. Consult professionals for health concerns.\"
3) Mention uncertainty from lighting/pose/camera lens, and no metabolic/lab data.
4) Include safety warnings for neck training and aggressive caloric deficits.
5) Keep advice culturally neutral unless user asked otherwise.

Be direct, realistic, and evidence-oriented.
""".strip()

REQUIRED_DISCLAIMER = (
    "This is visual estimation only, not a substitute for DEXA/calipers/doctor. "
    "Consult professionals for health concerns."
)


def _response_schema() -> dict[str, Any]:
    confidence_enum = ["low", "medium", "high"]

    insight_schema: dict[str, Any] = {
        "type": "object",
        "additionalProperties": False,
        "required": ["score", "confidence", "observations", "quick_wins", "cautions"],
        "properties": {
            "score": {"type": ["integer", "null"], "minimum": 1, "maximum": 10},
            "confidence": {"type": "string", "enum": confidence_enum},
            "observations": {"type": "array", "items": {"type": "string"}},
            "quick_wins": {"type": "array", "items": {"type": "string"}},
            "cautions": {"type": "array", "items": {"type": "string"}},
        },
    }

    body_fat_schema: dict[str, Any] = {
        "type": "object",
        "additionalProperties": False,
        "required": ["bf_estimate_percent", "confidence", "estimated_range", "rationale"],
        "properties": {
            "bf_estimate_percent": {"type": ["integer", "null"], "minimum": 3, "maximum": 60},
            "confidence": {"type": "string", "enum": confidence_enum},
            "estimated_range": {"type": "string"},
            "rationale": {"type": "array", "items": {"type": "string"}},
        },
    }

    return {
        "name": "vanity_advisor_response",
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "bf_estimate",
                "eyebrow",
                "neck_and_posture",
                "symmetry_and_skin",
                "glow_up_roadmap",
                "safety_and_limitations",
            ],
            "properties": {
                "bf_estimate": body_fat_schema,
                "eyebrow": insight_schema,
                "neck_and_posture": insight_schema,
                "symmetry_and_skin": insight_schema,
                "glow_up_roadmap": {"type": "array", "items": {"type": "string"}},
                "safety_and_limitations": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["disclaimer", "safety_notes", "limitations"],
                    "properties": {
                        "disclaimer": {"type": "string", "enum": [REQUIRED_DISCLAIMER]},
                        "safety_notes": {"type": "array", "items": {"type": "string"}},
                        "limitations": {"type": "array", "items": {"type": "string"}},
                    },
                },
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
            )
        except RateLimitError:
            return self._client.chat.completions.create(
                model=self._settings.openai_model_fallback,
                messages=messages,
                response_format=response_format,
            )
        except APIStatusError as exc:
            if exc.status_code is not None and exc.status_code >= 500:
                return self._client.chat.completions.create(
                    model=self._settings.openai_model_fallback,
                    messages=messages,
                    response_format=response_format,
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
                            "Analyze these physique/aesthetic photos and optional user metadata. "
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
            # Fallback for deployments where strict structured outputs with vision are unavailable.
            completion = self._create_completion_with_model_fallback(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            f"{SYSTEM_PROMPT}\n"
                            "Return strictly valid JSON with exactly these keys: "
                            "bf_estimate, eyebrow, neck_and_posture, symmetry_and_skin, "
                            "glow_up_roadmap, safety_and_limitations. "
                            f"safety_and_limitations.disclaimer must equal: {REQUIRED_DISCLAIMER}"
                        ),
                    },
                    messages[1],
                ],
                response_format={"type": "json_object"},
            )
            content = completion.choices[0].message.content or "{}"

        payload = json.loads(content)
        return VanityAdvisorResponse.model_validate(payload)
