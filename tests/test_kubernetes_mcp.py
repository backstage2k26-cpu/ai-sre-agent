import asyncio

from app.clients.kubernetes_mcp_client import KubernetesMCPClient


async def main():

    client = KubernetesMCPClient()

    print("\n========================================")
    print("     KUBERNETES MCP TOOL DISCOVERY")
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
    print("     MCP DISCOVERY COMPLETE")
    print("========================================")


if __name__ == "__main__":
    asyncio.run(main())