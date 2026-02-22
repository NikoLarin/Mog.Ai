from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="development", alias="APP_ENV")
    openai_api_key: str = Field(alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini-2024-07-18", alias="OPENAI_MODEL")
    openai_model_fallback: str = Field(default="gpt-4o-2024-08-06", alias="OPENAI_MODEL_FALLBACK")

    stripe_secret_key: str = Field(alias="STRIPE_SECRET_KEY")
    stripe_publishable_key: str = Field(alias="STRIPE_PUBLISHABLE_KEY")
    stripe_scan_price_cents: int = Field(default=499, alias="STRIPE_SCAN_PRICE_CENTS")
    stripe_currency: str = Field(default="usd", alias="STRIPE_CURRENCY")
    stripe_webhook_secret: str | None = Field(default=None, alias="STRIPE_WEBHOOK_SECRET")
    frontend_base_url: str = Field(
        default="https://mog-ai.vercel.app",
        validation_alias=AliasChoices("FRONTEND_URL", "FRONTEND_BASE_URL"),
    )

    max_images: int = Field(default=4, alias="MAX_IMAGES")
    max_image_size_mb: int = Field(default=10, alias="MAX_IMAGE_SIZE_MB")
    allowed_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000,https://mog-ai.vercel.app",
        alias="ALLOWED_ORIGINS",
    )
    requests_per_minute: int = Field(default=20, alias="REQUESTS_PER_MINUTE")


@lru_cache
def get_settings() -> Settings:
    return Settings()

