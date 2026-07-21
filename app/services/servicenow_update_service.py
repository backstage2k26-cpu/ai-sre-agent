from app.clients.servicenow_client import ServiceNowClient


class ServiceNowUpdateService:

    def __init__(self):
        self.client = ServiceNowClient()

    async def update(
        self,
        incident_number: str,
        report: str,
    ):

        # Fetch the latest incident from ServiceNow
        incident = await self.client.get_incident_by_number(
            incident_number
        )

        if incident is None:
            print(
                "Incident not found in ServiceNow. Skipping update."
            )
            return

        print("\n========== SERVICENOW UPDATE ==========")
        print(f"Incident Number : {incident_number}")
        print(f"Resolved sys_id : {incident.sys_id}")
        print("=======================================\n")

        await self.client.update_incident(
            incident.sys_id,
            {
                "work_notes": report,
            },
        )

        print("✅ ServiceNow incident updated successfully.")