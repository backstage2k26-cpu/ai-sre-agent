from pydantic import BaseModel

from app.schemas.investigation_result import InvestigationResult


class LogsInfo(BaseModel):
    entries: list[str]

    error_count: int

    warning_count: int

    recent_errors: bool

    assessment: InvestigationResult