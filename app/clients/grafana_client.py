from datetime import datetime, timedelta, timezone

import httpx

from app.core.config import settings


class GrafanaClient:

    def __init__(self):
        self.base_url = settings.grafana_url
        self.token = settings.grafana_token
        self.datasource_uid = settings.loki_datasource_uid

    async def query_logs(
        self,
        namespace: str,
        service: str,
        minutes: int,
    ) -> list[str]:

        headers = {
            "Authorization": f"Bearer {self.token}",
        }

        now = datetime.now(timezone.utc)
        start = now - timedelta(minutes=minutes)

        # Start broad. Once this works we can filter by container.
        query = (
            f'{{namespace="{namespace}", container="{service}"}}'
        )

        params = {
            "query": query,
            "limit": 500,
            "start": str(int(start.timestamp() * 1_000_000_000)),
            "end": str(int(now.timestamp() * 1_000_000_000)),
            "direction": "backward",
        }

        async with httpx.AsyncClient(timeout=30) as client:

            url = f"{self.base_url}/api/datasources/proxy/uid/{self.datasource_uid}/loki/api/v1/query_range"

            print(url)
            print(params)

            response = await client.get(
                url,
                headers=headers,
                params=params,
            )

            response.raise_for_status()

            data = response.json()

            logs = []

            for stream in data.get("data", {}).get("result", []):

                for _, line in stream.get("values", []):

                    logs.append(line)

            return logs