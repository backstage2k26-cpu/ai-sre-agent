from app.clients.kubernetes_client import KubernetesClient
from app.schemas.investigation import InvestigationContext
from app.schemas.kubernetes_assessment import KubernetesAssessment
from app.schemas.kubernetes_summary import KubernetesSummary
from app.analyzers.kubernetes_analyzer import KubernetesAnalyzer


class KubernetesService:

    def __init__(self):

        self.client = KubernetesClient()
        self.analyzer = KubernetesAnalyzer()

    async def investigate(
        self,
        context: InvestigationContext,
    ) -> KubernetesSummary:

        pods = await self.client.get_pods(
            context.namespace,
        )
        events = await self.client.get_events(
            context.namespace,
        )

        assessment = self.analyzer.analyse(
            pods,
            events,
        )

        return KubernetesSummary(
            pods=pods,
            events=events,
            assessment=assessment
        )