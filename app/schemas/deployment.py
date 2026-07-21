from pydantic import BaseModel, Field
from app.schemas.deployment_history import DeploymentHistory
from app.schemas.investigation_assessment import InvestigationAssessment


class DeploymentInfo(BaseModel):

    application: str
    namespace: str
    exists: bool
    health_status: str
    sync_status: str
    revision: str
    repo_url: str
    image_tag: str | None = None
    deployed_at: str | None = None
    deployed_by: str | None = None
    automated_sync: bool
    recent_deployment: bool
    operation_phase: str | None = None
    operation_message: str | None = None
    history: list[DeploymentHistory] = Field(default_factory=list)
    assessment: InvestigationAssessment | None = None