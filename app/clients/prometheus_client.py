import httpx

from app.core.config import settings


class PrometheusClient:

    def __init__(self):

        self.base_url = settings.grafana_url
        self.token = settings.grafana_token
        self.datasource_uid = settings.prometheus_datasource_uid

        self.headers = {
            "Authorization": f"Bearer {settings.grafana_token}"
        }

    async def query(
        self,
        promql: str,
    ):

        async with httpx.AsyncClient(
            verify=False,
            timeout=30,
        ) as client:

            url = (
                f"{self.base_url}"
                f"/api/datasources/proxy/uid/"
                f"{self.datasource_uid}"
                f"/api/v1/query"
            )

            print(url)
            print({"query": promql})

            response = await client.get(
                url,
                headers=self.headers,
                params={
                    "query": promql,
                },
            )

            response.raise_for_status()

            return response.json()