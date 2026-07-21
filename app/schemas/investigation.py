from pydantic import BaseModel
from app.integrations.argocd.models import DeploymentInfo


class InvestigationContext(BaseModel):

    incident_number: str
    service_name: str
    namespace: str
    problem_type: str
    priority: str
    search_window_minutes: int
    keywords: list[str]
    application_name: str
    namespace: str
    deployment: DeploymentInfo | None = None