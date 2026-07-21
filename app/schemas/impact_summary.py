from pydantic import BaseModel


class ImpactSummary(BaseModel):
    affected_service: str
    user_impact: str
    availability: str
    blast_radius: str
    affected_pods: str
    dependent_services: list[str]
    business_impact: str