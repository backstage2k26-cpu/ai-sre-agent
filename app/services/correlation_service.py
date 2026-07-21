from app.schemas.correlation_result import CorrelationResult
from app.schemas.deployment import DeploymentInfo
from app.schemas.logs import LogsInfo


class CorrelationService:

    def correlate(
        self,
        deployment: DeploymentInfo,
        logs: LogsInfo,
    ) -> CorrelationResult:

        confidence = 0.10

        findings = []

        evidence = []

        root_cause = "Unknown"

        severity = "LOW"

        # -------------------------
        # Deployment Analysis
        # -------------------------

        if deployment.recent_deployment:

            confidence += 0.30

            findings.append(
                "Recent deployment detected."
            )

            evidence.append(
                f"Deployment at {deployment.deployed_at}"
            )

        if deployment.health_status != "Healthy":

            confidence += 0.30

            findings.append(
                f"Application health is {deployment.health_status}"
            )

            evidence.append(
                deployment.health_status
            )

        if deployment.sync_status != "Synced":

            confidence += 0.20

            findings.append(
                f"Application sync is {deployment.sync_status}"
            )

            evidence.append(
                deployment.sync_status
            )

        # -------------------------
        # Log Analysis
        # -------------------------

        if logs.error_count:

            confidence += 0.40

            findings.append(
                f"{logs.error_count} ERROR log(s)"
            )

            evidence.append(
                "Runtime errors detected."
            )

        if logs.warning_count:

            confidence += 0.10

            findings.append(
                f"{logs.warning_count} WARN log(s)"
            )

        # -------------------------
        # Final Classification
        # -------------------------

        if confidence >= 0.85:

            root_cause = "Deployment"

            severity = "HIGH"

        elif confidence >= 0.60:

            root_cause = "Application"

            severity = "MEDIUM"

        summary = (
            f"Incident is likely related to "
            f"{root_cause.lower()}."
        )

        return CorrelationResult(

            probable_root_cause=root_cause,

            confidence=round(confidence, 2),

            severity=severity,

            findings=findings,

            evidence=evidence,

            summary=summary,
        )