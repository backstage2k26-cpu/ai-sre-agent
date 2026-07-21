from pydantic import BaseModel


class InvestigationResult(BaseModel):

    source: str

    confidence: float

    severity: str

    summary: str

    findings: list[str]