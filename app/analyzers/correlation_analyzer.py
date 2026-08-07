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

        total_logs = len(summary.logs.entries)

        logs_available = total_logs > 0

        logs_problem = (
            logs_available
            and summary.logs.error_count > 0
        )

        logs_ok = (
            logs_available
            and summary.logs.error_count == 0
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

        dependency_ok = getattr(
            summary.dependency,
            "healthy",
            True,
        )

        # ----------------------------------------------------
        # Pub/Sub
        # ----------------------------------------------------

        pubsub = getattr(summary, "pubsub", None)

        pubsub_exists = (
            pubsub is not None
            and getattr(pubsub, "status", "SKIPPED") != "SKIPPED"
        )

        pubsub_problem = (
            pubsub_exists
            and getattr(pubsub, "status", "") == "PROBLEM"
        )

        pubsub_warning = (
            pubsub_exists
            and getattr(pubsub, "status", "") == "WARNING"
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
                    "Deployment rollout or ArgoCD "
                    "synchronization failure."
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
                    "Pods are unhealthy. Possible scheduling "
                    "or runtime failure."
                ),
                confidence="High",
                findings=findings,
            )

        # ----------------------------------------------------
        # Logs
        # ----------------------------------------------------

        if logs_problem:

            log_finding = (
                "No application errors detected in collected logs."
                if logs_ok
                else "Application log evidence was unavailable."
            )

            findings.extend(
                [
                    "Deployment is healthy.",
                    "Pods are healthy.",
                    log_finding,
                    "Resource utilization is normal.",
                    "Network connectivity verified.",
                ]
            )

            return CorrelationResult(
                probable_root_cause=(
                    "Application runtime errors detected."
                ),
                confidence="High",
                findings=findings,
            )

        if not logs_available:

            findings.append(
                "No application log evidence was available "
                "during the investigation window."
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
                    "Application workload is healthy.",
                    "Network connectivity validation failed.",
                ]
            )

            return CorrelationResult(
                probable_root_cause=(
                    "Gateway, HTTPRoute or Service "
                    "connectivity issue."
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
                    "Core infrastructure is healthy.",
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
        # Pub/Sub Problem
        #
        # PubSubAnalyzer has already correlated:
        #
        # backlog
        # message age
        # ACK activity
        # delivery activity
        # backlog trend
        # DLQ
        # expired ACKs
        #
        # CorrelationAnalyzer should therefore consume that
        # assessment rather than duplicating all Pub/Sub rules.
        # ----------------------------------------------------

        if pubsub_problem:

            findings.extend(
                [
                    "Deployment is healthy.",
                    "Pods are healthy.",
                    "Resource utilization is normal.",
                    "Network connectivity is healthy.",
                ]
            )

            # Include all evidence generated by PubSubAnalyzer.

            for finding in getattr(
                pubsub,
                "findings",
                [],
            ):
                findings.append(
                    f"Pub/Sub: {finding}"
                )

            return CorrelationResult(
                probable_root_cause=(
                    pubsub.summary
                    or
                    "Pub/Sub message processing failure detected."
                ),
                confidence="High",
                findings=findings,
            )

        # ----------------------------------------------------
        # Pub/Sub Warning
        # ----------------------------------------------------

        if pubsub_warning:

            findings.extend(
                [
                    "Deployment is healthy.",
                    "Pods are healthy.",
                    "No application errors detected.",
                    "Resource utilization is normal.",
                    "Network connectivity is healthy.",
                ]
            )

            for finding in getattr(
                pubsub,
                "findings",
                [],
            ):
                findings.append(
                    f"Pub/Sub: {finding}"
                )

            findings.append(
                "Pub/Sub degradation exists, but current "
                "evidence is not strong enough to establish "
                "Pub/Sub as the confirmed root cause."
            )

            return CorrelationResult(
                probable_root_cause=(
                    "Pub/Sub message processing degradation "
                    "requires further investigation."
                ),
                confidence="Medium",
                findings=findings,
            )

        # ----------------------------------------------------
        # Healthy Infrastructure / Unresolved
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

        # ----------------------------------------------------
        # Pub/Sub healthy
        # ----------------------------------------------------

        if pubsub_exists:

            findings.append(
                "Pub/Sub dependency was discovered and "
                "no significant Pub/Sub processing problem "
                "was detected."
            )

            for finding in getattr(
                pubsub,
                "findings",
                [],
            ):
                findings.append(
                    f"Pub/Sub: {finding}"
                )

        # ----------------------------------------------------
        # Pub/Sub not used
        # ----------------------------------------------------

        else:

            findings.append(
                "No Pub/Sub dependency was discovered "
                "for this application."
            )

        # ----------------------------------------------------
        # Unknown Root Cause
        # ----------------------------------------------------

        return CorrelationResult(
            probable_root_cause=(
                "Infrastructure appears healthy. Current evidence "
                "is insufficient to determine the root cause."
            ),
            confidence="Low",
            findings=findings,
        )