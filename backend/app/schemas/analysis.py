from typing import Literal

from pydantic import BaseModel, Field


class UserContext(BaseModel):
    height_cm: float | None = Field(default=None, ge=80, le=260)
    weight_kg: float | None = Field(default=None, ge=25, le=300)
    age: int | None = Field(default=None, ge=13, le=100)
    gender: str | None = None
    goals: str | None = Field(default=None, max_length=500)


class Insight(BaseModel):
    score: int | None = Field(default=None, ge=1, le=10)
    confidence: Literal["low", "medium", "high"]
    observations: list[str]
    quick_wins: list[str]
    cautions: list[str]


class BodyFatEstimate(BaseModel):
    bf_estimate_percent: int | None = Field(default=None, ge=3, le=60)
    confidence: Literal["low", "medium", "high"]
    estimated_range: str
    rationale: list[str]


class SafetyAndLimitations(BaseModel):
    disclaimer: str
    safety_notes: list[str]
    limitations: list[str]


class VanityAdvisorResponse(BaseModel):
    bf_estimate: BodyFatEstimate
    eyebrow: Insight
    neck_and_posture: Insight
    symmetry_and_skin: Insight
    glow_up_roadmap: list[str]
    safety_and_limitations: SafetyAndLimitations
