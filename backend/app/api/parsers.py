from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.parsers.registry import parser_registry
from app.parsers.regex_parser import RegexParser
from app.models.plugin import ParserPlugin
from app.processing.cleaner import data_cleaner
from app.processing.normalizer import log_normalizer
from app.schemas.plugin import (
    ParserPluginResponse,
    ParserPluginCreate,
    ParserTestRequest,
    ParserTestResponse,
)

router = APIRouter(prefix="/parsers", tags=["Parser Plugins"])


@router.get("", response_model=List[dict])
async def list_parsers():
    """
    Returns list of all active parsers (both built-in and dynamically registered).
    """
    return parser_registry.list_metadata()


@router.post("/test", response_model=ParserTestResponse)
async def test_parser_sandbox(payload: ParserTestRequest):
    """
    Interactive parser sandbox: Tests a parser against a sample log line and shows
    immediate parsed fields and normalized Universal Log representation.
    """
    sample = payload.sample_log.strip()
    if not sample:
        return ParserTestResponse(
            success=False,
            parser_name=payload.parser_name,
            error_message="Sample log line cannot be empty",
        )

    # Resolve parser
    parser = parser_registry.get(payload.parser_name)
    if not parser:
        # Search by name match
        for p in parser_registry.get_all():
            if p.name.lower() == payload.parser_name.lower():
                parser = p
                break

    if not parser:
        return ParserTestResponse(
            success=False,
            parser_name=payload.parser_name,
            error_message=f"Parser '{payload.parser_name}' not found",
        )

    try:
        raw_parsed = parser.parse(sample)
        cleaned = data_cleaner.clean_record(raw_parsed, mask_data=True)
        normalized = log_normalizer.normalize_record(
            cleaned_dict=cleaned,
            source_type=parser.format_key,
            source_name="sandbox_test",
        )
        return ParserTestResponse(
            success=True,
            parser_name=parser.name,
            parsed_fields=raw_parsed,
            normalized_log=normalized.model_dump(mode="json"),
        )
    except Exception as ex:
        return ParserTestResponse(
            success=False,
            parser_name=parser.name,
            error_message=str(ex),
        )


@router.post("", response_model=ParserPluginResponse)
async def create_custom_parser(plugin_in: ParserPluginCreate, db: AsyncSession = Depends(get_db)):
    """
    Registers a new custom regex parser plugin.
    """
    # Check if duplicate name
    res = await db.execute(select(ParserPlugin).filter(ParserPlugin.name == plugin_in.name))
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="A parser plugin with this name already exists")

    new_plugin = ParserPlugin(
        name=plugin_in.name,
        version=plugin_in.version,
        format_key=plugin_in.format_key,
        description=plugin_in.description,
        regex_pattern=plugin_in.regex_pattern,
        is_builtin=False,
        status="ACTIVE",
        configuration=plugin_in.configuration or {},
    )
    db.add(new_plugin)
    await db.commit()
    await db.refresh(new_plugin)

    # Register into runtime registry
    if plugin_in.regex_pattern:
        custom_parser = RegexParser(
            custom_pattern=plugin_in.regex_pattern,
            name=plugin_in.name,
        )
        parser_registry.register(custom_parser)

    return ParserPluginResponse.model_validate(new_plugin)
