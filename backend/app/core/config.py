from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="development", alias="APP_ENV")
    openai_api_key: str = Field(alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-2024-08-06", alias="OPENAI_MODEL")
    openai_model_fallback: str = Field(default="gpt-4o-mini-2024-07-18", alias="OPENAI_MODEL_FALLBACK")
    max_images: int = Field(default=4, alias="MAX_IMAGES")
    max_image_size_mb: int = Field(default=10, alias="MAX_IMAGE_SIZE_MB")
    allowed_origins: str = Field(default="http://localhost:3000", alias="ALLOWED_ORIGINS")
    requests_per_minute: int = Field(default=20, alias="REQUESTS_PER_MINUTE")


@lru_cache
def get_settings() -> Settings:
    return Settings()
