import asyncio
from pprint import pprint

from app.clients.kubernetes_client import KubernetesClient


async def main():

    client = KubernetesClient()

    events = await client.get_events(
        "market-dev"
    )

    pprint(events)


asyncio.run(main())