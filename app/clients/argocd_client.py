import httpx

from app.core.config import settings


class ArgoCDClient:

    def __init__(self):

        self.base_url = settings.argocd_url.rstrip("/")

        self.token = settings.argocd_token

        self.timeout = settings.request_timeout

    @property
    def headers(self):

        return {
            "Authorization": f"Bearer {self.token}"
        }

    async def get_application(
        self,
        app_name: str,
    ):

        url = (
            f"{self.base_url}"
            f"/api/v1/applications/{app_name}"
        )

        async with httpx.AsyncClient(
            verify=False,
            timeout=self.timeout,
        ) as client:

            response = await client.get(
                url,
                headers=self.headers,
            )

            response.raise_for_status()

            return response.json()