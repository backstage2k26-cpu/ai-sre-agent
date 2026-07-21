import asyncio

from app.analyzers.metrics_analyzer import MetricsAnalyzer
from app.clients.prometheus_client import PrometheusClient
from app.schemas.investigation import InvestigationContext
from app.schemas.metrics_summary import MetricsSummary


class MetricsService:

    def __init__(self):

        self.client = PrometheusClient()

        self.analyzer = MetricsAnalyzer()

    async def investigate(
        self,
        context: InvestigationContext,
    ) -> MetricsSummary:

        cpu_query = f"""
sum(rate(container_cpu_usage_seconds_total{{
namespace="{context.namespace}",
container!="POD"
}}[5m])) by (pod)
"""

        memory_query = f"""
sum(container_memory_working_set_bytes{{
namespace="{context.namespace}",
container!="POD"
}}) by (pod)
"""

        cpu, memory = await asyncio.gather(
            self.client.query(cpu_query),
            self.client.query(memory_query),
        )

        assessment = self.analyzer.analyse(
            cpu,
            memory,
        )

        return MetricsSummary(
            cpu=cpu,
            memory=memory,
            assessment=assessment,
        )