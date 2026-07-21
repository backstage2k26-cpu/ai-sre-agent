from pydantic import BaseModel


class Recommendation(BaseModel):
    priority: int
    action: str
    reason: str


class RecommendationSummary(BaseModel):
    recommendations: list[Recommendation]
    estimated_time: str