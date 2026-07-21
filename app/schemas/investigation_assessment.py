from pydantic import BaseModel


class InvestigationAssessment(BaseModel):
    source: str
    confidence: float
    severity: str
    summary: str
    findings: list[str]