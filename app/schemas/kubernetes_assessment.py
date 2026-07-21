from pydantic import BaseModel


class KubernetesAssessment(BaseModel):

    source: str

    confidence: float

    severity: str

    summary: str

    findings: list[str]