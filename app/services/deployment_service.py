from datetime import datetime, timezone

from app.clients.argocd_client import ArgoCDClient
from app.schemas.deployment import DeploymentInfo
from app.schemas.investigation import InvestigationContext
from app.schemas.investigation_assessment import InvestigationAssessment
from app.schemas.deployment_history import DeploymentHistory


class DeploymentService:

    def __init__(self):
        self.client = ArgoCDClient()

    async def investigate(
        self,
        context: InvestigationContext,
    ) -> DeploymentInfo:

        app = await self.client.get_application(
            context.application_name
        )

        return self._build_deployment_info(
            app,
            context,
        )

    def _build_deployment_info(
        self,
        app: dict,
        context: InvestigationContext,
    ) -> DeploymentInfo:

        application = app["metadata"]["name"]

        namespace = app["spec"]["destination"]["namespace"]

        health = app["status"]["health"]["status"]

        sync = app["status"]["sync"]["status"]

        revisions = app["status"]["sync"].get("revisions", [])
        revision = revisions[0] if revisions else ""

        repo = app["spec"]["sources"][0]["repoURL"]

        images = app["status"]["summary"].get("images", [])
        image = images[0] if images else None

        history = app["status"].get("history", [])

        deployment_history = []

        for item in history[-5:]:
            initiated = item.get("initiatedBy", {})

            deployment_history.append(
                DeploymentHistory(
                    id=item.get("id"),
                    revision=item.get("revision", ""),
                    deployed_at=item.get("deployedAt", ""),
                    deployed_by=initiated.get("username"),
                    automated=initiated.get("automated", False),
                )
            )

        last = history[-1] if history else {}

        deployed_at = last.get("deployedAt")

        initiated = last.get("initiatedBy", {})

        deployed_by = initiated.get("username")

        automated = initiated.get("automated", False)

        operation = app["status"].get("operationState", {})

        phase = operation.get("phase")

        message = operation.get("message")

        recent = False

        if deployed_at:

            deploy_time = datetime.fromisoformat(
                deployed_at.replace("Z", "+00:00")
            )

            incident_time = datetime.now(
                timezone.utc
            )

            diff = (
                incident_time -
                deploy_time
            ).total_seconds()

            recent = diff <= (
                context.search_window_minutes * 60
            )

        assessment = self._assess_deployment(
            health=health,
            sync=sync,
            recent=recent,
            automated=automated,
        )

        return DeploymentInfo(

            application=application,

            namespace=namespace,

            exists=True,

            health_status=health,

            sync_status=sync,

            revision=revision,

            repo_url=repo,

            image_tag=image,

            deployed_at=deployed_at,

            deployed_by=deployed_by,

            automated_sync=automated,

            recent_deployment=recent,

            operation_phase=phase,

            operation_message=message,

            history=deployment_history,

            assessment=assessment,
        )
    
    def _assess_deployment(
        self,
        health: str,
        sync: str,
        recent: bool,
        automated: bool,
    ) -> InvestigationAssessment:

        findings = []

        confidence = 0.10

        severity = "LOW"

        summary = "Deployment is unlikely to be related to the incident."

        if health != "Healthy":
            findings.append(f"Application health is {health}")
            confidence += 0.35

        else:
            findings.append("Application is Healthy")

        if sync != "Synced":
            findings.append(f"Application sync status is {sync}")
            confidence += 0.25

        else:
            findings.append("Application is Synced")

        if recent:
            findings.append("Recent deployment detected")
            confidence += 0.30
        else:
            findings.append("No recent deployment detected")

        if automated:
            findings.append("Deployment was automated")
        else:
            findings.append("Deployment was manual")

        if confidence >= 0.80:
            severity = "HIGH"
            summary = "Deployment is highly correlated with the incident."

        elif confidence >= 0.50:
            severity = "MEDIUM"
            summary = "Deployment may be contributing to the incident."

        return InvestigationAssessment(
            source="ArgoCD",
            confidence=round(confidence, 2),
            severity=severity,
            summary=summary,
            findings=findings,
        )