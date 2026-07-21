import asyncio
from pprint import pprint

from app.clients.prometheus_client import PrometheusClient


async def main():

    client = PrometheusClient()

    result = await client.query(
        'up'
    )

    pprint(result)


if __name__ == "__main__":
    asyncio.run(main())