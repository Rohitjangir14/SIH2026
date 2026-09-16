import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DEFAULT_DB_FILE = os.path.join(BASE_DIR, "ulpf.db").replace("\\", "/")


class Settings(BaseSettings):
    PROJECT_NAME: str = "ULPF — Universal Log Pre-processing Framework"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security / Auth
    SECRET_KEY: str = Field(
        default="ulpf_dev_insecure_secret_key_change_in_production",
        description="JWT Signing secret. Set via environment variable in production.",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (Defaults to absolute SQLite for seamless local execution; works with PostgreSQL)
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DEFAULT_DB_FILE}"
    SYNC_DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_FILE}"
    
    # CORS: Explicit allowed origins (Never use ['*'] with allow_credentials=True to maintain valid CORS spec)
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
        "http://127.0.0.1",
    ]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v
    
    # Enrichment
    ENABLE_GEOIP_MOCK: bool = True
    
    # Sensitive Data Redaction
    ENABLE_DATA_MASKING: bool = True
    SALTED_PII_SECRET: str = os.getenv("ULPF_SALTED_PII_SECRET", "ulpf_enterprise_audit_salt_2026")
    
    # Authentication & Access Control
    REQUIRE_AUTH: bool = False
    INITIAL_ADMIN_USERNAME: str = os.getenv("ULPF_ADMIN_USERNAME", "admin")
    INITIAL_ADMIN_PASSWORD: str = os.getenv("ULPF_ADMIN_PASSWORD", "admin123")
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
