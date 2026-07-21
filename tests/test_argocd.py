import asyncio

from app.clients.argocd_client import ArgoCDClient


async def main():

    client = ArgoCDClient()

    app = await client.get_application(
        "market-dev"
    )

    print(app)


asyncio.run(main())