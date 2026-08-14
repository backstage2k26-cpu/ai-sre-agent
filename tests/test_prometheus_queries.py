import asyncio
from pprint import pprint

from app.clients.grafana_investigation_mcp import GrafanaInvestigationMCP


async def run_query(title: str, query: str):
    client = GrafanaInvestigationMCP()

    print(f"\n{'=' * 20} {title} {'=' * 20}")

    result = await client.query_metrics(
        expr=query,
        start_time="now-30m",
        end_time="now",
        step_seconds=60,
    )

    pprint(result)


async def main():

    await run_query(
        "CPU",
        """
sum(rate(container_cpu_usage_seconds_total{
namespace="market-dev",
container!="POD"
}[5m])) by (pod)
""",
    )

    await run_query(
        "MEMORY",
        """
sum(container_memory_rss{
namespace="market-dev",
container!="POD"
}) by (pod)
""",
    )

    await run_query(
        "NETWORK RX",
        """
sum(rate(container_network_receive_bytes_total{
namespace="market-dev"
}[5m])) by (pod)
""",
    )

    await run_query(
        "NETWORK TX",
        """
sum(rate(container_network_transmit_bytes_total{
namespace="market-dev"
}[5m])) by (pod)
""",
    )


if __name__ == "__main__":
    asyncio.run(main())