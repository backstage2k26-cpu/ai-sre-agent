import httpx

from app.core.config import settings


class ServiceNowClient:

    def __init__(self):
        self.base_url = settings.servicenow_url.rstrip("/")
        self.auth = (
            settings.servicenow_username,
            settings.servicenow_password,
        )
        self.timeout = settings.request_timeout

    async def get_incident_list(self, limit: int = 20):

        url = f"{self.base_url}/api/now/table/incident"

        params = {
            "sysparm_query": "caller_id=javascript:gs.getUserID()^active=true^universal_requestISEMPTY",
            "sysparm_limit": limit,
            "sysparm_display_value": "true",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:

            response = await client.get(
                url,
                params=params,
                auth=self.auth,
                headers={"Accept": "application/json"},
            )

            response.raise_for_status()

            data = response.json()["result"]

            print("\n========== ServiceNow Incident List ==========")
            print(f"Returned {len(data)} incidents")

            for incident in data:
                print(
                    f"{incident.get('number')} | "
                    f"State={incident.get('state')} | "
                    f"Active={incident.get('active')} | "
                    f"Short Description={incident.get('short_description')}"
                )

            print("=============================================\n")

            return data

    async def get_incident(
        self,
        incident_sys_id: str,
    ):

        url = (
            f"{self.base_url}"
            f"/api/now/table/incident/{incident_sys_id}"
        )

        async with httpx.AsyncClient(timeout=self.timeout) as client:

            response = await client.get(
                url,
                auth=self.auth,
                headers={
                    "Accept": "application/json",
                },
            )

            response.raise_for_status()

            return response.json()["result"]

    async def get_incident_by_number(
        self,
        incident_number: str,
    ) -> dict | None:

        url = f"{self.base_url}/api/now/table/incident"

        params = {
            "sysparm_query": f"number={incident_number}",
            "sysparm_limit": 1,
            "sysparm_display_value": "true",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:

            response = await client.get(
                url,
                params=params,
                auth=self.auth,
                headers={
                    "Accept": "application/json",
                },
            )

            response.raise_for_status()

            content_type = response.headers.get("content-type", "")

            print("\n========== SERVICENOW SEARCH ==========")
            print("Status:", response.status_code)
            print("Content-Type:", content_type)

            if "application/json" not in content_type:
                print(response.text)
                raise RuntimeError(
                    "ServiceNow returned a non-JSON response."
                )

            result = response.json().get("result", [])

            if not result:
                print(f"Incident {incident_number} not found.")
                return None

            print(f"Found incident: {result[0]['number']}")

            return result[0]

    async def update_incident(
        self,
        incident_sys_id: str,
        payload: dict,
    ):

        url = (
            f"{self.base_url}"
            f"/api/now/table/incident/{incident_sys_id}"
        )

        async with httpx.AsyncClient(
            timeout=self.timeout,
        ) as client:

            response = await client.patch(
                url,
                auth=self.auth,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

            response.raise_for_status()

            return response.json()["result"]