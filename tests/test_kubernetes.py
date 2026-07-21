import asyncio

from app.clients.kubernetes_client import KubernetesClient


async def main():

    client = KubernetesClient()

    pods = await client.get_pods(
        "market-dev",
    )

    from pprint import pprint

    pprint(pods)


asyncio.run(main())