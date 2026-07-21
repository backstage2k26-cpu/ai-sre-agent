from app.schemas.executive_summary import ExecutiveSummary


class ExecutiveSummaryService:

    async def investigate(
        self,
        deployment,
        logs,
        kubernetes,
        metrics,
        network,
        correlation,
    ):

        summary = []

        # Overall application health
        if (
            deployment.assessment.severity == "LOW"
            and kubernetes.assessment.severity == "LOW"
            and metrics.assessment.severity == "LOW"
            and logs.error_count == 0
        ):
            summary.append(
                "Application health is normal across deployment, Kubernetes, logs and metrics."
            )
        else:
            summary.append(
                "One or more application health checks require attention."
            )

        # Network
        if (
            network.gateway_ok
            and network.route_ok
            and network.endpoint_ok
        ):
            summary.append(
                "Ingress routing is correctly configured and service endpoints are available."
            )
        else:
            summary.append(
                "Gateway or HTTPRoute configuration may be affecting traffic."
            )

        # Deployment
        if deployment.recent_deployment:
            summary.append(
                "A recent deployment occurred and should be reviewed."
            )
        else:
            summary.append(
                "No recent deployments were detected."
            )

        # Root cause
        likely_cause = correlation.probable_root_cause
        summary.append(f"Current assessment: {likely_cause}")

        # Owner recommendation
        cause = likely_cause.lower()

        if "outside" in cause or "network" in cause:
            owner = "Platform / Networking Team"
        elif "deployment" in cause:
            owner = "DevOps Team"
        elif "application" in cause:
            owner = "Application Team"
        else:
            owner = "Platform Team"

        return ExecutiveSummary(
            summary=summary,
            likely_cause=likely_cause,
            recommended_owner=owner,
        )