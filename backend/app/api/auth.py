import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    oauth2_scheme,
    UserRole,
)
from app.models.user import User
from app.schemas.auth import UserLogin, UserRegister, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not token:
        if settings.REQUIRE_AUTH:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required. Please provide a valid Bearer token.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Demo mode when REQUIRE_AUTH is false: unauthenticated caller gets limited viewer context
        result = await db.execute(select(User).filter(User.username == "demo_viewer"))
        user = result.scalars().first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                username="demo_viewer",
                email="viewer@ulpf.internal",
                password_hash=get_password_hash("demo123"),
                role=UserRole.VIEWER.value,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        return user

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    result = await db.execute(select(User).filter(User.username == username))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Returns current authenticated user if token present, else None."""
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        if not payload:
            return None
        username: str = payload.get("sub")
        if not username:
            return None
        result = await db.execute(select(User).filter(User.username == username))
        return result.scalars().first()
    except Exception:
        return None


def require_roles(*allowed_roles: str):
    """Dependency ensuring caller has one of the allowed roles."""
    async def _role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of roles: {', '.join(allowed_roles)}. Current role: {current_user.role}",
            )
        return current_user
    return _role_checker


require_admin = require_roles(UserRole.ADMIN.value)
require_analyst = require_roles(UserRole.ADMIN.value, UserRole.ANALYST.value)


@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter((User.username == user_in.username) | (User.email == user_in.email)))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    # Strict security: self-registration CANNOT grant admin privileges
    assigned_role = user_in.role.lower().strip() if user_in.role else UserRole.ANALYST.value
    if assigned_role == UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Self-registration as administrator is forbidden. Contact existing administrator.",
        )
    if assigned_role not in [UserRole.ANALYST.value, UserRole.VIEWER.value, "operator"]:
        assigned_role = UserRole.ANALYST.value

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=assigned_role,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(data={"sub": new_user.username, "role": new_user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(new_user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.username == credentials.username))
    user = result.scalars().first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    token = create_access_token(data={"sub": user.username, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.put("/users/{username}/role", response_model=UserOut)
async def update_user_role(
    username: str,
    new_role: str = Query(..., pattern="^(admin|analyst|operator|viewer)$"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Administrator-only endpoint to promote or alter user roles.
    """
    result = await db.execute(select(User).filter(User.username == username))
    target_user = result.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail=f"User {username} not found")

    target_user.role = new_role.lower()
    await db.commit()
    await db.refresh(target_user)
    return UserOut.model_validate(target_user)
