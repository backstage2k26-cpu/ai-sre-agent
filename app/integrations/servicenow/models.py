from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

@dataclass(slots=True)
class IncidentContext:
    incident_id: str
    incident_number: str
    short_description: str
    description: str
    priority: str
    severity: str
    state: str
    assignment_group: str | None
    configuration_item: str | None
    caller: str | None
    opened_at: datetime | None
    updated_at: datetime | None

@dataclass(slots=True)
class InvestigationRequest:
    investigation_id: str
    incident: IncidentContext
    received_at: datetime