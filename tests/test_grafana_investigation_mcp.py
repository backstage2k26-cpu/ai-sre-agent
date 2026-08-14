import asyncio

from app.clients.grafana_investigation_mcp import GrafanaInvestigationMCP


async def main():

    client = GrafanaInvestigationMCP()

    print("\n================ CPU Metrics ================\n")

    cpu = await client.list_prometheus_metric_names(
        ".*cpu.*"
    )

    print(cpu)

    print("\n================ Memory Metrics ================\n")

    memory = await client.list_prometheus_metric_names(
        ".*memory.*"
    )

    print(memory)

    print("\n================ Pod Metrics ================\n")

    pod = await client.list_prometheus_metric_names(
        ".*pod.*"
    )

    print(pod)

    print("\n================ Container Metrics ================\n")

    container = await client.list_prometheus_metric_names(
        ".*container.*"
    )

    print(container)


if __name__ == "__main__":
    asyncio.run(main())