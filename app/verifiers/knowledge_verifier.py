from app.schemas.knowledge_summary import KnowledgeSummary

from app.schemas.deployment import DeploymentInfo
from app.schemas.logs import LogsInfo
from app.schemas.kubernetes_summary import KubernetesSummary
from app.schemas.metrics_summary import MetricsSummary


class KnowledgeVerifier:

    def verify(
        self,
        knowledge: KnowledgeSummary,
        deployment: DeploymentInfo,
        logs: LogsInfo,
        kubernetes: KubernetesSummary,
        metrics: MetricsSummary,
    ) -> KnowledgeSummary:

        if not knowledge.found:
            return knowledge

        for match in knowledge.matches:

            findings = []

            if deployment.assessment.severity == "LOW":
                findings.append("Deployment healthy")

            if logs.assessment.severity == "LOW":
                findings.append("No application errors")

            if kubernetes.assessment.severity == "LOW":
                findings.append("Pods healthy")

            if metrics.assessment.severity == "LOW":
                findings.append("Resource utilization normal")

            if len(findings) >= 3:

                match.status = "VERIFIED"

                match.reason = (
                    "Current evidence matches this runbook."
                )

            else:

                match.status = "REJECTED"

                match.reason = (
                    "Current evidence does not support this runbook."
                )

            match.verified_findings = findings

        return knowledge