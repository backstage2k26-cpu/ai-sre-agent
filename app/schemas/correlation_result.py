from pydantic import BaseModel


class CorrelationResult(BaseModel):

    probable_root_cause: str

    confidence: str

    findings: list[str]