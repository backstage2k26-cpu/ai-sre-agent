from pydantic import BaseModel


class KnowledgeMatch(BaseModel):

    title: str

    similarity: float

    summary: str

    recommendation: str

    source: str

    status: str = "PENDING"

    reason: str = ""

    verified_findings: list[str] = []