from typing import Literal

from pydantic import BaseModel, Field


class UserContext(BaseModel):
    height_cm: float | None = Field(default=None, ge=80, le=260)
    weight_kg: float | None = Field(default=None, ge=25, le=300)
    age: int | None = Field(default=None, ge=13, le=100)
    gender: str | None = None
    goals: str | None = Field(default=None, max_length=500)


class BodyFatEstimate(BaseModel):
    percentage: float | None = Field(default=None, ge=3, le=60)
    confidence: Literal["low", "medium", "high"]
    range: str


class VanityAdvisorResponse(BaseModel):
    overall_aesthetic_summary: str
    strengths: list[str] = Field(min_length=4, max_length=7)
    areas_for_improvement: list[str] = Field(min_length=3)
    body_fat_estimate: BodyFatEstimate
    key_ratings: dict[str, float]
    personalized_roadmap: list[str] = Field(min_length=3)
    style_tips: list[str]
    safety_notes: str
    disclaimer: str
    limitations: list[str]
