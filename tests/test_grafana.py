import asyncio

from app.clients.grafana_client import GrafanaClient


async def main():

    client = GrafanaClient()

    logs = await client.query_logs(
        namespace="market-dev",
        service="market",
        minutes=30,
    )

    if not logs:
        logs = await client.query_logs(
            namespace="market-dev",
            service="market",
            minutes=360,   # last 6 hours
        )

    if not logs:
        logs = await client.query_logs(
            namespace="market-dev",
            service="market",
            minutes=1440,  # last 24 hours
        )

    print(f"Total logs: {len(logs)}")

    for log in logs[:10]:
        print(log)


asyncio.run(main())