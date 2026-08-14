import asyncio
import json

from app.schemas.investigation import InvestigationContext
from app.schemas.metrics_summary import MetricsSummary
from app.analyzers.metrics_analyzer import MetricsAnalyzer
from app.clients.grafana_investigation_mcp import GrafanaInvestigationMCP
from app.clients.kubernetes_client import KubernetesClient


class MetricsService:

    def __init__(self):
        self.analyzer = MetricsAnalyzer()
        self.mcp = GrafanaInvestigationMCP()
        self.kubernetes = KubernetesClient()

    def _parse_mcp_result(self, result) -> list:

        if not result.content:
            return []

        if result.is_error:
            print(
                f"MCP Error: {result.content[0].text}"
            )
            return []

        try:
            data = json.loads(
                result.content[0].text
            )
        except (json.JSONDecodeError, TypeError):
            return []

        if not isinstance(data, dict):
            return []

        metrics = data.get("data", [])

        if isinstance(metrics, list):
            return metrics

        if isinstance(metrics, dict):
            return metrics.get("result", [])

        return []

    async def investigate(
        self,
        context: InvestigationContext,
    ) -> MetricsSummary:

        namespace = context.namespace
        window = context.search_window_minutes
        application_pods = await self.kubernetes.get_application_pods(
            namespace=namespace,
            application_name=context.application_name,
        )

        if not application_pods:
            return MetricsSummary(
                pods=[],
                assessment={
                    "source": "Prometheus",
                    "confidence": 0.0,
                    "severity": "UNKNOWN",
                    "summary": "No application pods were found for the investigation.",
                    "findings": [
                        f"No pods found for application '{context.application_name}' "
                        f"in namespace '{namespace}'."
                    ],
                },
            )

        pod_selector = "|".join(application_pods)

        cpu_query = f"""
sum(
    rate(
        container_cpu_usage_seconds_total{{
            namespace="{namespace}",
            pod=~"{pod_selector}",
            container!="POD",
            container!=""
        }}[5m]
    )
) by (pod)
"""

        memory_query = f"""
sum(
    container_memory_working_set_bytes{{
        namespace="{namespace}",
        pod=~"{pod_selector}",
        container!="POD",
        container!=""
    }}
) by (pod)
"""

        network_rx_query = f"""
sum(
    rate(
        container_network_receive_bytes_total{{
            namespace="{namespace}",
            pod=~"{pod_selector}"
        }}[5m]
    )
) by (pod)
"""

        network_tx_query = f"""
sum(
    rate(
        container_network_transmit_bytes_total{{
            namespace="{namespace}",
            pod=~"{pod_selector}"
        }}[5m]
    )
) by (pod)
"""

        (
            cpu_result,
            memory_result,
            network_rx_result,
            network_tx_result,
        ) = await asyncio.gather(

            self.mcp.query_metrics(
                cpu_query,
                start_time=f"now-{window}m",
                end_time="now",
                step_seconds=60,
            ),

            self.mcp.query_metrics(
                memory_query,
                start_time=f"now-{window}m",
                end_time="now",
                step_seconds=60,
            ),

            self.mcp.query_metrics(
                network_rx_query,
                start_time=f"now-{window}m",
                end_time="now",
                step_seconds=60,
            ),

            self.mcp.query_metrics(
                network_tx_query,
                start_time=f"now-{window}m",
                end_time="now",
                step_seconds=60,
            ),
        )

        cpu = self._parse_mcp_result(cpu_result)

        memory = self._parse_mcp_result(
            memory_result
        )

        network_rx = self._parse_mcp_result(
            network_rx_result
        )

        network_tx = self._parse_mcp_result(
            network_tx_result
        )

        pods, assessment = self.analyzer.analyse(
            cpu=cpu,
            memory=memory,
            network_rx=network_rx,
            network_tx=network_tx,
        )

        return MetricsSummary(
            pods=pods,
            assessment=assessment,
        )