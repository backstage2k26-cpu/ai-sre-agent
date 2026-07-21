import asyncio
import httpx

from app.core.config import settings

async def main():
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.grafana_url}/api/datasources",
            headers={
                "Authorization": f"Bearer {settings.grafana_token}"
            },
        )

        print(response.status_code)
        print(response.json())

asyncio.run(main())