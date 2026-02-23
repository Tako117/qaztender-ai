from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

    APP_NAME: str = "TenderGuard AI"
    APP_VERSION: str = "0.1.0"

    # Explicit demo switch (honest product behavior)
    DEMO_MODE: bool = True

    # CORS
    CORS_ALLOW_ORIGINS: str = "*"  # set to your frontend URL in production

    # Data paths
    MARKET_PATH: str = "app/data/seed_market.json"
    HISTORY_PATH: str = "app/data/seed_history.json"

settings = Settings()