from datetime import datetime

from pydantic import BaseModel


class Incident(BaseModel):
    sys_id: str
    number: str
    short_description: str
    description: str | None = None
    priority: str
    assignment_group: str | None = None
    state: str
    opened_at: datetime
    configuration_item: str | None = None
    caller: str | None = None
    updated_at: datetime | None = None


class ServiceNowWebhookRequest(BaseModel):
    event_type: str
    incident: Incident