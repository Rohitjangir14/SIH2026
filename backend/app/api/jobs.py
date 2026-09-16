from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.job import ProcessingJob
from app.models.validation_error import ValidationErrorRecord
from app.models.user import User
from app.api.auth import get_current_user, require_analyst
from app.schemas.job import JobResponse

router = APIRouter(prefix="/jobs", tags=["Processing Jobs"])


@router.get("", response_model=List[JobResponse])
async def list_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
async def get_job_details(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ProcessingJob).filter(ProcessingJob.id == id))
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    err_res = await db.execute(select(ValidationErrorRecord).filter(ValidationErrorRecord.job_id == id).limit(50))
    errors = err_res.scalars().all()

    can_view_raw = current_user.role in ("admin", "analyst")
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
                "raw_content": e.raw_content if can_view_raw else "[REDACTED - SENSITIVE RAW CONTENT REQUIRES ANALYST OR ADMIN ROLE]",
                "error_type": e.error_type,
                "error_details": e.error_details,
                "created_at": e.created_at,
            }
            for e in errors
        ],
    }


@router.post("/{id}/replay", response_model=JobResponse)
async def replay_job(
    id: str,
    forced_format: Optional[str] = Query(None, description="Optionally override parser format on replay"),
    current_user: User = Depends(require_analyst),
    db: AsyncSession = Depends(get_db),
):
    """
    Forensic Replay Engine:
    Re-processes all immutable RawLog records from an existing batch job
    through the latest pipeline/parser versions. Strictly protected by RBAC.
    """
    from app.models.raw_log import RawLog
    from app.processing.pipeline import pipeline_runner

    job_res = await db.execute(select(ProcessingJob).filter(ProcessingJob.id == id))
    original_job = job_res.scalars().first()
    if not original_job:
        raise HTTPException(status_code=404, detail="Job not found")

    raw_res = await db.execute(
        select(RawLog.raw_content)
        .filter(RawLog.job_id == id)
        .order_by(RawLog.received_at.asc())
    )
    raw_lines = raw_res.scalars().all()
    if not raw_lines:
        raise HTTPException(status_code=400, detail="No raw logs found for this job to replay")

    combined_content = "\n".join(raw_lines)
    new_job = await pipeline_runner.execute(
        db=db,
        raw_content=combined_content,
        source_name=f"{original_job.source}_replay",
        file_name=f"replay_{original_job.file_name or 'stream'}",
        forced_format=forced_format or original_job.detected_format,
    )

    rate = round((new_job.processed_records / new_job.total_records * 100) if new_job.total_records > 0 else 0.0, 2)
    return JobResponse(
        id=new_job.id,
        source=new_job.source,
        file_name=new_job.file_name,
        detected_format=new_job.detected_format,
        parser_used=new_job.parser_used,
        total_records=new_job.total_records,
        processed_records=new_job.processed_records,
        failed_records=new_job.failed_records,
        status=new_job.status,
        started_at=new_job.started_at,
        completed_at=new_job.completed_at,
        duration_ms=new_job.duration_ms,
        error_message=new_job.error_message,
        success_rate=rate,
    )
