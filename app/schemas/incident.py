from datetime import datetime

from pydantic import BaseModel


class Incident(BaseModel):

    sys_id: str
    number: str
    short_description: str
    description: str | None = None
    priority: str | None = None
    severity: str | None = None
    state: str | None = None
    assignment_group: str | None = None
    business_service: str | None = None
    cmdb_ci: str | None = None
    category: str | None = None
    subcategory: str | None = None
    opened_at: datetime | None = None