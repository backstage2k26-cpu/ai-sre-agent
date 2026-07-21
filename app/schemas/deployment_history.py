from pydantic import BaseModel


class DeploymentHistory(BaseModel):
    id: int
    revision: str
    deployed_at: str
    deployed_by: str | None = None
    automated: bool