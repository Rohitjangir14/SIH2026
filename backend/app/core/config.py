from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "ULPF — Universal Log Pre-processing Framework"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security / Auth
    SECRET_KEY: str = "ulpf_super_secret_jwt_key_sih_2026_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (Defaults to SQLite for seamless local execution; works with PostgreSQL)
    DATABASE_URL: str = "sqlite+aiosqlite:///./ulpf.db"
    SYNC_DATABASE_URL: str = "sqlite:///./ulpf.db"
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # Enrichment
    ENABLE_GEOIP_MOCK: bool = True
    
    # Sensitive Data Redaction
    ENABLE_DATA_MASKING: bool = True
    
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
