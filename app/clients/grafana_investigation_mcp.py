from app.clients.grafana_mcp_client import GrafanaMCPClient
from app.core.config import settings


class GrafanaInvestigationMCP:

    def __init__(self):
        self.client = GrafanaMCPClient()

        self.loki_uid = settings.loki_datasource_uid
        self.prometheus_uid = settings.prometheus_datasource_uid

    async def call_tool(
        self,
        tool_name: str,
        arguments: dict | None = None,
    ):
        return await self.client.call_tool(
            tool_name,
            arguments or {},
        )

    async def query_logs(
        self,
        logql: str,
        start_time: str = "now-1h",
        end_time: str = "now",
        limit: int = 100,
    ):
        return await self.call_tool(
            "query_loki_logs",
            {
                "datasourceUid": self.loki_uid,
                "logql": logql,
                "startRfc3339": start_time,
                "endRfc3339": end_time,
                "limit": limit,
                "direction": "backward",
                "queryType": "range",
            },
        )

    async def query_metrics(
        self,
        expr: str,
        start_time: str = "now-1h",
        end_time: str = "now",
        step_seconds: int = 60,
    ):
        return await self.call_tool(
            "query_prometheus",
            {
                "datasourceUid": self.prometheus_uid,
                "expr": expr,
                "queryType": "range",
                "startTime": start_time,
                "endTime": end_time,
                "stepSeconds": step_seconds,
            },
        )

    async def list_prometheus_metric_names(
        self,
        regex: str | None = None,
    ):
        args = {
            "datasourceUid": self.prometheus_uid,
        }

        if regex:
            args["regex"] = regex

        return await self.call_tool(
            "list_prometheus_metric_names",
            args,
        )

    async def list_prometheus_label_names(self):
        return await self.call_tool(
            "list_prometheus_label_names",
            {
                "datasourceUid": self.prometheus_uid,
            },
        )

    async def list_prometheus_label_values(
        self,
        label_name: str,
    ):
        return await self.call_tool(
            "list_prometheus_label_values",
            {
                "datasourceUid": self.prometheus_uid,
                "labelName": label_name,
            },
        )