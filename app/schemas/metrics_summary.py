from pydantic import BaseModel

from app.schemas.metrics_assessment import MetricsAssessment


class MetricsSummary(BaseModel):

    cpu: dict

    memory: dict

    assessment: MetricsAssessment