from pydantic import BaseModel

from app.schemas.metrics_assessment import MetricsAssessment
from app.schemas.pod_metrics import PodMetrics


class MetricsSummary(BaseModel):

    pods: list[PodMetrics]

    assessment: MetricsAssessment