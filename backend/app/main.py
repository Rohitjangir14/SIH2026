from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.core.security import get_password_hash, UserRole
from app.models.user import User
from app.models.source import LogSource
from app.models.plugin import ParserPlugin
from app.parsers.registry import parser_registry
from app.api.auth import router as auth_router
from app.api.logs import router as logs_router
from app.api.jobs import router as jobs_router
from app.api.analytics import router as analytics_router
from app.api.parsers import router as parsers_router
from app.api.sources import router as sources_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    await init_db()

    # Seed default data if empty
    async with AsyncSessionLocal() as session:
        # Check admin user (configured via settings/environment variables)
        admin_username = settings.INITIAL_ADMIN_USERNAME
        user_res = await session.execute(select(User).filter(User.username == admin_username))
        if not user_res.scalars().first():
            admin_user = User(
                username=admin_username,
                email=f"{admin_username}@ulpf.internal",
                password_hash=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
                role=UserRole.ADMIN.value,
            )
            session.add(admin_user)

        # Seed default log sources
        sources_to_seed = [
            ("Linux Infrastructure", "linux"),
            ("AWS CloudWatch Logs", "aws"),
            ("Production Apache Cluster", "apache"),
            ("Nginx Reverse Proxy", "nginx"),
            ("Windows Domain Controller", "windows"),
            ("Payment Gateway Service", "app"),
        ]
        for name, stype in sources_to_seed:
            s_res = await session.execute(select(LogSource).filter(LogSource.name == name))
            if not s_res.scalars().first():
                session.add(LogSource(name=name, source_type=stype))

        # Seed built-in parser plugin records
        for p in parser_registry.get_all():
            plug_res = await session.execute(select(ParserPlugin).filter(ParserPlugin.name == p.name))
            if not plug_res.scalars().first():
                session.add(
                    ParserPlugin(
                        name=p.name,
                        version="1.0.0",
                        format_key=p.format_key,
                        description=p.get_metadata().get("description"),
                        is_builtin=True,
                        status="ACTIVE",
                    )
                )

        await session.commit()

    # Security check on SECRET_KEY
    if "insecure" in settings.SECRET_KEY or "change_in_production" in settings.SECRET_KEY:
        import logging
        logging.getLogger("uvicorn.error").warning(
            "[SECURITY NOTICE] Using default development SECRET_KEY. For production deployment, configure the SECRET_KEY environment variable."
        )

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Universal Log Pre-processing Framework — Real-Time Log Ingestion, Format Detection, Normalization & Analytics",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware with explicit origins & local port regex (Standard W3C compliant with credentials)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(logs_router, prefix=settings.API_V1_STR)
app.include_router(jobs_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(parsers_router, prefix=settings.API_V1_STR)
app.include_router(sources_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ULPF API Gateway",
        "version": settings.VERSION,
        "engine": "active",
    }


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "online",
        "endpoints": {
            "ingest_upload": f"{settings.API_V1_STR}/logs/upload",
            "ingest_paste": f"{settings.API_V1_STR}/logs/paste",
            "detect": f"{settings.API_V1_STR}/logs/detect",
            "logs": f"{settings.API_V1_STR}/logs",
            "jobs": f"{settings.API_V1_STR}/jobs",
            "analytics": f"{settings.API_V1_STR}/analytics/summary",
            "parsers": f"{settings.API_V1_STR}/parsers",
        },
    }
