from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Optional[str] = "analyst"

    @field_validator("role", mode="before")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> str:
        if v:
            v_clean = str(v).lower().strip()
            if v_clean == "admin":
                raise ValueError("Self-registration as administrator is forbidden. Role must be analyst or viewer.")
            if v_clean not in ["analyst", "viewer", "operator"]:
                return "analyst"
            return v_clean
        return "analyst"


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: str
    role: str
    created_at: datetime


TokenResponse.model_rebuild()
