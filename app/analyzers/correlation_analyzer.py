from app.schemas.correlation_result import CorrelationResult
from app.schemas.investigation_summary import InvestigationSummary


class CorrelationAnalyzer:

    def analyse(
        self,
        summary: InvestigationSummary,
    ) -> CorrelationResult:

        findings = []

        # ----------------------------------------------------
        # Health Checks
        # ----------------------------------------------------

        deployment_ok = (
            summary.deployment.health_status == "Healthy"
            and summary.deployment.sync_status == "Synced"
        )

        logs_ok = (
            summary.logs.error_count == 0
        )

        pods_ok = (
            summary.kubernetes.assessment.severity == "LOW"
        )

        metrics_ok = (
            summary.metrics.assessment.severity == "LOW"
        )

        network_ok = (
            summary.network.gateway_ok
            and summary.network.route_ok
            and summary.network.endpoint_ok
        )

        dependency_ok = (
            getattr(summary.dependency, "healthy", True)
        )

        # ----------------------------------------------------
        # Deployment
        # ----------------------------------------------------

        if not deployment_ok:

            findings.extend(
                [
                    "Deployment is unhealthy.",
                    "Application is not fully synchronized.",
                ]
            )

            return CorrelationResult(
                probable_root_cause=(
                    "Deployment rollout or ArgoCD synchronization failure."
                ),
                confidence="High",
                findings=findings,
            )

        # ----------------------------------------------------
        # Kubernetes
        # ----------------------------------------------------

        if not pods_ok:

            findings.extend(
                [
                    "Deployment is healthy.",
                    "Kubernetes workload is unhealthy.",
                ]
            )

            return CorrelationResult(
                probable_root_cause=(
                    "Pods are unhealthy. Possible scheduling or runtime failure."
                ),
                confidence="High",
                findings=findings,
            )

        # ----------------------------------------------------
        # Logs
        # ----------------------------------------------------

        if not logs_ok:

            findings.extend(
                [
                    "Deployment is healthy.",
                    "Pods are running.",
                    f"{summary.logs.error_count} application errors detected.",
                ]
            )

            return CorrelationResult(
                probable_root_cause=(
                    "Application runtime errors detected."
                ),
                confidence="High",
                findings=findings,
            )

        # ----------------------------------------------------
        # Metrics
        # ----------------------------------------------------

        if not metrics_ok:

            findings.extend(
                [
                    "Deployment is healthy.",
                    "Pods are healthy.",
                    "Resource utilization is elevated.",
                ]
            )

            return CorrelationResult(
                probable_root_cause=(
                    "High CPU or memory utilization detected."
                ),
                confidence="Medium",
                findings=findings,
            )

        # ----------------------------------------------------
        # Network
        # ----------------------------------------------------

        if not network_ok:

            findings.extend(
                [
                    "Deployment is healthy.",
                    "Application is healthy.",
                    "Network connectivity validation failed.",
                ]
            )

            return CorrelationResult(
                probable_root_cause=(
                    "Gateway, HTTPRoute or Service connectivity issue."
                ),
                confidence="High",
                findings=findings,
            )

        # ----------------------------------------------------
        # Dependency
        # ----------------------------------------------------

        if not dependency_ok:

            findings.extend(
                [
                    "Infrastructure is healthy.",
                    "Dependent service appears unavailable.",
                ]
            )

            return CorrelationResult(
                probable_root_cause=(
                    "Dependent service or upstream API failure."
                ),
                confidence="Medium",
                findings=findings,
            )

        # ----------------------------------------------------
        # Healthy Infrastructure
        # ----------------------------------------------------

        findings.extend(
            [
                "Deployment is healthy.",
                "Pods are healthy.",
                "No application errors detected.",
                "Resource utilization is normal.",
                "Network connectivity verified.",
            ]
        )

        return CorrelationResult(
            probable_root_cause=(
                "Infrastructure appears healthy. The incident is likely caused by an external dependency, client request issue, or business logic outside the platform."
            ),
            confidence="Medium",
            findings=findings,
        )