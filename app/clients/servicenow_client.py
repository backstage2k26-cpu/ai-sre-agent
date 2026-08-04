import httpx

from app.core.config import settings
from datetime import datetime, timedelta


class ServiceNowClient:

    INCIDENT_FILTER = (
        "active=true"
        "^caller.name=system administrator"
    )

    def __init__(self):
        self.base_url = settings.servicenow_url.rstrip("/")
        self.auth = (
            settings.servicenow_username,
            settings.servicenow_password,
        )
        self.timeout = settings.request_timeout
        print("ServiceNow URL:", self.base_url)

    async def get_incident_list(self, limit: int = 1000):

        url = f"{self.base_url}/api/now/table/incident"

        params = {
            "sysparm_query": self.INCIDENT_FILTER,
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

            data = response.json()
            results = data.get("result", [])

            return results

            content_type = response.headers.get("content-type", "")

            if "application/json" not in content_type:
                print("ServiceNow unavailable (hibernating or HTML response).")
                return []

            return response.json().get("result", [])

    async def get_incident_trend(self):

        url = f"{self.base_url}/api/now/table/incident"

        start_date = (
            datetime.utcnow() - timedelta(days=6)
        ).strftime("%Y-%m-%d 00:00:00")

        params = {
            "sysparm_query": (
                f"{self.INCIDENT_FILTER}"
                f"^sys_created_on>={start_date}"
            ),
            "sysparm_fields": "sys_created_on,resolved_at",
            "sysparm_limit": "10000",
            "sysparm_display_value": "false",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:

            response = await client.get(
                url,
                params=params,
                auth=self.auth,
                headers={"Accept": "application/json"},
            )

            response.raise_for_status()

            content_type = response.headers.get("content-type", "")

            if "application/json" not in content_type:
                print("ServiceNow unavailable (hibernating or HTML response).")
                return []
            response_json = response.json()

            return response_json.get("result", [])

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
        
    async def count_incidents_between(
        self,
        start: datetime,
        end: datetime,
    ) -> int:

        url = f"{self.base_url}/api/now/table/incident"

        start_str = start.strftime("%Y-%m-%d %H:%M:%S")
        end_str = end.strftime("%Y-%m-%d %H:%M:%S")

        params = {
            "sysparm_query": (
                "active=true"
                "^caller_id.name=system administrator"
                f"^sys_created_on>={start_str}"
                f"^sys_created_on<{end_str}"
            ),
            "sysparm_limit": "10000",
            "sysparm_fields": "sys_id",
            "sysparm_display_value": "false",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:

            response = await client.get(
                url,
                params=params,
                auth=self.auth,
                headers={"Accept": "application/json"},
            )

            response.raise_for_status()

            return len(response.json().get("result", []))
        
    async def count_total_incidents(self) -> int:

        url = f"{self.base_url}/api/now/table/incident"

        params = {
            "sysparm_query": (
                "active=true"
                "^caller_id.name=system administrator"
            ),
            "sysparm_fields": "sys_id",
            "sysparm_limit": "10000",
            "sysparm_display_value": "false",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:

            response = await client.get(
                url,
                params=params,
                auth=self.auth,
                headers={"Accept": "application/json"},
            )

            response.raise_for_status()

            return len(response.json().get("result", []))