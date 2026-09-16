from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.job import ProcessingJob
from app.models.validation_error import ValidationErrorRecord
from app.schemas.job import JobResponse

router = APIRouter(prefix="/jobs", tags=["Processing Jobs"])


@router.get("", response_model=List[JobResponse])
async def list_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProcessingJob).order_by(desc(ProcessingJob.started_at)).limit(100))
    jobs = result.scalars().all()

    response = []
    for job in jobs:
        rate = round((job.processed_records / job.total_records * 100) if job.total_records > 0 else 0.0, 2)
        response.append(
            JobResponse(
                id=job.id,
                source=job.source,
                file_name=job.file_name,
                detected_format=job.detected_format,
                parser_used=job.parser_used,
                total_records=job.total_records,
                processed_records=job.processed_records,
                failed_records=job.failed_records,
                status=job.status,
                started_at=job.started_at,
                completed_at=job.completed_at,
                duration_ms=job.duration_ms,
                error_message=job.error_message,
                success_rate=rate,
            )
        )
    return response


@router.get("/{id}")
async def get_job_details(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProcessingJob).filter(ProcessingJob.id == id))
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    err_res = await db.execute(select(ValidationErrorRecord).filter(ValidationErrorRecord.job_id == id).limit(50))
    errors = err_res.scalars().all()

    rate = round((job.processed_records / job.total_records * 100) if job.total_records > 0 else 0.0, 2)
    return {
        "job": JobResponse(
            id=job.id,
            source=job.source,
            file_name=job.file_name,
            detected_format=job.detected_format,
            parser_used=job.parser_used,
            total_records=job.total_records,
            processed_records=job.processed_records,
            failed_records=job.failed_records,
            status=job.status,
            started_at=job.started_at,
            completed_at=job.completed_at,
            duration_ms=job.duration_ms,
            error_message=job.error_message,
            success_rate=rate,
        ),
        "validation_errors": [
            {
                "id": e.id,
                "raw_content": e.raw_content,
                "error_type": e.error_type,
                "error_details": e.error_details,
                "created_at": e.created_at,
            }
            for e in errors
        ],
    }
