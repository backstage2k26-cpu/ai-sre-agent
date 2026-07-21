import asyncio

from app.clients.servicenow_client import ServiceNowClient


async def main():
    client = ServiceNowClient()

    try:
        # Fetch only one incident to verify connectivity
        incident = await client.get_incident_list(limit=1)

        print("\n✅ Connected to ServiceNow\n")
        print(incident)

    except Exception as e:
        print("\n❌ Connection Failed\n")
        print(e)


asyncio.run(main())