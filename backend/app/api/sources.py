from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.source import LogSource
from app.schemas.source import LogSourceCreate, LogSourceResponse

router = APIRouter(prefix="/sources", tags=["Log Sources"])


@router.get("", response_model=List[LogSourceResponse])
async def list_sources(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(LogSource).order_by(LogSource.created_at.desc()))
    return res.scalars().all()


@router.post("", response_model=LogSourceResponse)
async def create_source(source_in: LogSourceCreate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(LogSource).filter(LogSource.name == source_in.name))
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="Source with this name already exists")

    new_source = LogSource(
        name=source_in.name,
        source_type=source_in.source_type,
        configuration=source_in.configuration or {},
    )
    db.add(new_source)
    await db.commit()
    await db.refresh(new_source)
    return LogSourceResponse.model_validate(new_source)
