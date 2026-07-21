from pydantic import BaseModel

from app.schemas.kubernetes_assessment import KubernetesAssessment


class KubernetesSummary(BaseModel):

    pods: list[dict]

    events: list[dict]

    assessment: KubernetesAssessment