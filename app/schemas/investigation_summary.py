from pydantic import BaseModel

from app.schemas.metrics_summary import MetricsSummary
from app.schemas.correlation_result import CorrelationResult
from app.schemas.deployment import DeploymentInfo
from app.schemas.logs import LogsInfo
from app.schemas.investigation import InvestigationContext
from app.schemas.kubernetes_summary import KubernetesSummary
from app.schemas.knowledge_summary import KnowledgeSummary
from app.schemas.network_summary import NetworkSummary
from app.schemas.dependency_summary import DependencySummary
from app.schemas.evidence_score import EvidenceScore
from app.schemas.recommendation import RecommendationSummary
from app.schemas.executive_summary import ExecutiveSummary
from app.schemas.investigation_result import InvestigationResult
from app.schemas.impact_summary import ImpactSummary
from app.schemas.ai_investigation_result import AIInvestigationResult
from app.schemas.log_summary import LogSummary


class InvestigationSummary(BaseModel):

    context: InvestigationContext
    deployment: DeploymentInfo
    logs: LogsInfo
    kubernetes: KubernetesSummary
    metrics: MetricsSummary
    knowledge: KnowledgeSummary
    correlation: CorrelationResult | None = None
    report: str | None = None
    timeline: list | None = None
    network: NetworkSummary
    dependency: DependencySummary
    evidence: EvidenceScore | None = None
    recommendations: RecommendationSummary | None = None
    executive: ExecutiveSummary
    investigation_result: InvestigationResult | None = None
    impact: ImpactSummary | None = None
    ai_result: AIInvestigationResult | None = None
    log_summary: LogSummary | None = None