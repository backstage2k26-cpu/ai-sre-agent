from pydantic import BaseModel


class ExecutiveSummary(BaseModel):
    summary: list[str]
    likely_cause: str
    recommended_owner: str