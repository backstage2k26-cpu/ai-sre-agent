from pydantic import BaseModel


class DatabaseImpact(BaseModel):
    database_name: str
    database_type: str
    status: str
    metric: str
    score: str
    direction: str
    affected_services: list[str]
    evidence: list[str]
    summary: str
