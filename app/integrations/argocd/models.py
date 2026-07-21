from datetime import datetime

from pydantic import BaseModel


class DeploymentInfo(BaseModel):
    application: str
    sync_status: str | None = None
    health_status: str | None = None
    revision: str | None = None
    phase: str | None = None
    finished_at: datetime | None = None