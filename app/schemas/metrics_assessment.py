from pydantic import BaseModel


class MetricsAssessment(BaseModel):

    source: str

    confidence: float

    severity: str

    summary: str

    findings: list[str]