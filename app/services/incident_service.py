from app.clients.servicenow_client import ServiceNowClient
from app.schemas.incident import Incident


class IncidentService:

    def __init__(self):
        self.client = ServiceNowClient()

    async def fetch_by_number(self, incident_number: str) -> Incident:
        """
        Fetch an incident from ServiceNow using its incident number
        and normalize it into our internal Incident schema.
        """

        incident = await self.client.get_incident_by_number(
            incident_number
        )

        return Incident(
            sys_id=incident.get("sys_id"),
            number=incident.get("number"),
            short_description=incident.get("short_description"),
            description=incident.get("description"),
            priority=incident.get("priority"),
            severity=incident.get("severity"),
            state=incident.get("state"),
            assignment_group=(
                incident.get("assignment_group", {}).get("display_value")
                if isinstance(incident.get("assignment_group"), dict)
                else incident.get("assignment_group")
            ),
            business_service=(
                incident.get("business_service", {}).get("display_value")
                if isinstance(incident.get("business_service"), dict)
                else incident.get("business_service")
            ),
            cmdb_ci=(
                incident.get("cmdb_ci", {}).get("display_value")
                if isinstance(incident.get("cmdb_ci"), dict)
                else incident.get("cmdb_ci")
            ),
            category=incident.get("category"),
            subcategory=incident.get("subcategory"),
            opened_at=incident.get("opened_at"),
        )

    async def fetch_open_incidents(self, limit: int = 20) -> list[Incident]:

        incidents = await self.client.get_incident_list(limit)

        return [
            Incident(
                sys_id=i.get("sys_id"),
                number=i.get("number"),
                short_description=i.get("short_description"),
                description=i.get("description"),
                priority=i.get("priority"),
                severity=i.get("severity"),
                state=i.get("state"),
                assignment_group=(
                    i.get("assignment_group", {}).get("display_value")
                    if isinstance(i.get("assignment_group"), dict)
                    else i.get("assignment_group")
                ),
                business_service=(
                    i.get("business_service", {}).get("display_value")
                    if isinstance(i.get("business_service"), dict)
                    else i.get("business_service")
                ),
                cmdb_ci=(
                    i.get("cmdb_ci", {}).get("display_value")
                    if isinstance(i.get("cmdb_ci"), dict)
                    else i.get("cmdb_ci")
                ),
                category=i.get("category"),
                subcategory=i.get("subcategory"),
                opened_at=i.get("opened_at"),
            )
            for i in incidents
        ]