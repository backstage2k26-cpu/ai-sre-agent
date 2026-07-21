from pydantic import BaseModel


class RootCause(BaseModel):
    title: str
    description: str


class AIInvestigationResult(BaseModel):
    diagnosis: str
    root_cause: RootCause
    confidence: int
    business_impact: str
    resolution_plan: list[str]
    prevention: list[str]
    reasoning: list[str]
    estimated_recovery_time: str