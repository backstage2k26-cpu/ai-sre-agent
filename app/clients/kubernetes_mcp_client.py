from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

from app.core.config import settings


class KubernetesMCPClient:

    def __init__(self):
        self.url = settings.kubernetes_mcp_url

    async def list_tools(self):

        async with streamable_http_client(
            self.url
        ) as (
            read_stream,
            write_stream,
        ):

            async with ClientSession(
                read_stream,
                write_stream,
            ) as session:

                await session.initialize()

                result = await session.list_tools()

                return result.tools

    async def call_tool(
        self,
        tool_name: str,
        arguments: dict | None = None,
    ):

        async with streamable_http_client(
            self.url
        ) as (
            read_stream,
            write_stream,
        ):

            async with ClientSession(
                read_stream,
                write_stream,
            ) as session:

                await session.initialize()

                result = await session.call_tool(
                    tool_name,
                    arguments or {},
                )

                return result