from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Optional[str] = "analyst"


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
