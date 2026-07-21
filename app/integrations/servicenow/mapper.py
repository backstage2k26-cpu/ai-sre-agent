from datetime import datetime, UTC
from uuid import uuid4

from app.integrations.servicenow.models import (
    IncidentContext,
    InvestigationRequest,
)
from app.schemas.servicenow import ServiceNowWebhookRequest


class ServiceNowMapper:

    @staticmethod
    def to_investigation_request(
        payload: ServiceNowWebhookRequest,
    ) -> InvestigationRequest:

        incident = payload.incident

        return InvestigationRequest(
            investigation_id=f"INV-{uuid4().hex[:8].upper()}",
            received_at=datetime.now(UTC),
            incident=IncidentContext(
                incident_id=incident.sys_id,
                incident_number=incident.number,
                short_description=incident.short_description,
                description=incident.description,
                priority=incident.priority,
                severity=incident.priority,
                state=incident.state,
                assignment_group=incident.assignment_group,
                configuration_item=incident.configuration_item,
                caller=incident.caller,
                opened_at=incident.opened_at,
                updated_at=incident.updated_at
                or incident.opened_at,
            ),
        )

    @staticmethod
    def from_incident(
        incident,
    ) -> InvestigationRequest:

        return InvestigationRequest(
            investigation_id=f"INV-{uuid4().hex[:8].upper()}",
            received_at=datetime.now(UTC),
            incident=IncidentContext(
                incident_id=incident.sys_id,
                incident_number=incident.number,
                short_description=incident.short_description,
                description=incident.description,
                priority=incident.priority,
                severity=incident.priority,
                state=incident.state,
                assignment_group=incident.assignment_group,
                configuration_item=getattr(
                    incident,
                    "configuration_item",
                    None,
                ),
                caller=getattr(
                    incident,
                    "caller",
                    None,
                ),
                opened_at=incident.opened_at,
                updated_at=getattr(
                    incident,
                    "updated_at",
                    incident.opened_at,
                ),
            ),
        )