import asyncio

from app.clients.grafana_mcp_client import GrafanaMCPClient


async def main():

    client = GrafanaMCPClient()

    print("\n========================================")
    print("       GRAFANA MCP TOOL DISCOVERY")
    print("========================================")

    tools = await client.list_tools()

    print(f"\nTotal tools: {len(tools)}\n")

    for tool in tools:

        print("----------------------------------------")
        print("Name:")
        print(tool.name)

        print("\nDescription:")
        print(tool.description)

        print("\nInput schema:")
        print(tool.input_schema)

    print("\n========================================")
    print("       MCP DISCOVERY COMPLETE")
    print("========================================")


if __name__ == "__main__":
    asyncio.run(main())