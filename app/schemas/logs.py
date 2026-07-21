from pydantic import BaseModel

from app.schemas.investigation_assessment import InvestigationAssessment


class LogsInfo(BaseModel):
    entries: list[str]

    error_count: int

    warning_count: int

    recent_errors: bool

    assessment: InvestigationAssessment