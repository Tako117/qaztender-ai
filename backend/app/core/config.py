from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

    # Branding
    APP_NAME: str = "QazTender AI"
    APP_VERSION: str = "0.2.0"

    # Privacy-aware logging: keep minimal logs by default
    LOG_LEVEL: str = "INFO"

    # CORS
    CORS_ALLOW_ORIGINS: str = "*"  # comma-separated

    # Web intelligence controls
    WEB_CACHE_DB: str = "backend/app/storage/web_cache.sqlite"
    WEB_CACHE_TTL_S: int = 6 * 3600

    # Model paths (can be overridden by env)
    QAZTENDER_MODEL_PATH: str = "backend/app/ml/artifacts/qaztender_baseline.joblib"
    QAZTENDER_DEMO_DATA: str = "backend/app/ml/demo_data.jsonl"


settings = Settings()
