from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class UserContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    height_cm: float | None = Field(default=None, ge=80, le=260)
    weight_kg: float | None = Field(default=None, ge=25, le=300)
    height_ft: int | None = Field(default=None, ge=3, le=8)
    height_in: int | None = Field(default=None, ge=0, le=11)
    weight_lbs: float | None = Field(default=None, ge=55, le=660)
    age: int | None = Field(default=None, ge=13, le=100)
    email: str | None = Field(default=None, min_length=5, max_length=320)
    gender: str | None = None
    goals: str | None = Field(default=None, max_length=500)


class BodyFatEstimate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    percentage: float = Field(ge=3, le=60)
    range: str | None
    confidence: Literal["high", "medium", "low"]


class VanityAdvisorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    overall_aesthetic_summary: str
    strengths: list[str] = Field(min_length=4, max_length=7)
    areas_for_improvement: list[str] = Field(min_length=3)
    body_fat_estimate: BodyFatEstimate
    personalized_steps: list[str] = Field(min_length=3)
    limitations: list[str]


class PreviewReportResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: str
    strengths: list[str] = Field(min_length=3, max_length=5)
    hidden_insights_count: int = Field(ge=3)
    tease_line: str


class PreparedScanResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scan_id: str
    image_count: int
    message: str


class CreateCheckoutRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scan_id: str


class CreateCheckoutResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_id: str
    publishable_key: str


class AnalyzePaidRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scan_id: str
    stripe_session_id: str
