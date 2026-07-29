import asyncio
import time

from openai import APITimeoutError, APIError
from datetime import datetime, UTC

from app.schemas.incident import Incident
from app.schemas.investigation_summary import InvestigationSummary
from app.schemas.executive_summary import ExecutiveSummary

from app.services.analysis_service import AnalysisService
from app.services.deployment_service import DeploymentService
from app.services.logs_service import LogsService
from app.services.kubernetes_service import KubernetesService
from app.services.metrics_service import MetricsService
from app.services.knowledge_service import KnowledgeService
from app.services.network_service import NetworkService
from app.services.dependency_service import DependencyService
from app.services.recommendation_service import RecommendationService
from app.services.executive_summary_service import ExecutiveSummaryService
from app.services.investigation_result_service import (
    InvestigationResultService,
)
from app.services.impact_service import ImpactService
from app.services.timeline_service import TimelineService
from app.services.investigation_reasoner import InvestigationReasoner

from app.verifiers.knowledge_verifier import KnowledgeVerifier

from app.analyzers.correlation_analyzer import CorrelationAnalyzer
from app.analyzers.evidence_analyzer import EvidenceAnalyzer
from app.analyzers.log_analyzer import LogAnalyzer
from app.services.servicenow_update_service import (
    ServiceNowUpdateService,
)
from app.core.config import settings
from app.repositories.incident_repository import IncidentRepository
from app.database.session import SessionLocal


class InvestigationService:

    def __init__(self):

        self.analysis = AnalysisService()
        self.deployments = DeploymentService()
        self.logs = LogsService()
        self.kubernetes = KubernetesService()
        self.metrics = MetricsService()
        self.knowledge = KnowledgeService()
        self.network = NetworkService()
        self.dependency = DependencyService()
        self.knowledge_verifier = KnowledgeVerifier()
        self.correlation = CorrelationAnalyzer()
        self.evidence = EvidenceAnalyzer()
        self.recommendations = RecommendationService()
        self.executive = ExecutiveSummaryService()
        self.investigation_result = InvestigationResultService()
        self.impact = ImpactService()
        self.timeline_service = TimelineService()
        self.reasoner = InvestigationReasoner()
        self.log_analyzer = LogAnalyzer()
        self.snow_update = ServiceNowUpdateService()
        self.db = SessionLocal()
        self.incident_repo = IncidentRepository(self.db)

    async def investigate(
        self,
        incident: Incident,
        progress_callback=None,
    ) -> InvestigationSummary:

        started_at = time.time()

        # ----------------------------------------------------
        # Build Context
        # ----------------------------------------------------

        print("\n========== 1. BUILD CONTEXT ==========")

        context = await self.analysis.analyse(incident)

        # -----------------------------------------
        # Update normalized service
        # -----------------------------------------

        print("========== UPDATE SERVICE ==========")
        print("Application :", context.application_name)
        print("Namespace   :", context.namespace)
        print("Normalized  :", getattr(context, "normalized_service", None))

        if getattr(context, "normalized_service", None):

            print("Calling update_service()")

            self.incident_repo.update_service(
                incident_number=incident.number,
                service=context.normalized_service,
            )

            print(f"Updated service -> {context.normalized_service}")
        else:
            print("normalized_service is empty")

        # ----------------------------------------------------
        # Collect Evidence
        # ----------------------------------------------------

        print("\n========== 2. COLLECT EVIDENCE ==========")

        (
            knowledge,
            deployment,
            logs,
            kubernetes,
            metrics,
            network,
            dependency,
        ) = await asyncio.gather(
            self.knowledge.search(context),
            self.deployments.investigate(context),
            self.logs.investigate(context),
            self.kubernetes.investigate(context),
            self.metrics.investigate(context),
            self.network.investigate(context),
            self.dependency.investigate(context),
        )

        print("\n========== DEPLOYMENT ==========")

        print(f"Application : {deployment.application}")
        print(f"Namespace   : {deployment.namespace}")
        print(f"Health      : {deployment.health_status}")
        print(f"Sync        : {deployment.sync_status}")
        print(f"Revision    : {deployment.revision}")
        print(f"Recent      : {deployment.recent_deployment}")
        print(f"Automated   : {deployment.automated_sync}")
        print(f"Phase       : {deployment.operation_phase}")
        print(f"Assessment  : {deployment.assessment.summary}")

        if progress_callback:
            progress_callback(40, "Collecting Evidence")

        
        log_summary = self.log_analyzer.analyse(logs)
        print("\n========== LOG SUMMARY ==========")
        print(f"Total Logs     : {log_summary.total_logs}")
        print(f"Errors         : {log_summary.error_count}")
        print(f"Warnings       : {log_summary.warning_count}")
        print(f"Exceptions     : {log_summary.exception_count}")
        print(f"CrashLoop      : {log_summary.crashloop_count}")
        print(f"OOMKilled      : {log_summary.oom_count}")
        print(f"Timeouts       : {log_summary.timeout_count}")
        print(f"ImagePull      : {log_summary.imagepull_count}")
        print(f"Likely Failure : {log_summary.likely_failure}")

        # ----------------------------------------------------
        # Verify Knowledge
        # ----------------------------------------------------

        print("\n========== 3. VERIFY KNOWLEDGE ==========")

        knowledge = self.knowledge_verifier.verify(
            knowledge,
            deployment,
            logs,
            kubernetes,
            metrics,
        )

        if progress_callback:
            progress_callback(55, "Verifying Knowledge")

        # ----------------------------------------------------
        # Build Investigation Summary
        # ----------------------------------------------------

        print("\n========== 4. BUILD SUMMARY ==========")

        summary = InvestigationSummary(
            context=context,
            knowledge=knowledge,
            deployment=deployment,
            logs=logs,
            kubernetes=kubernetes,
            metrics=metrics,
            network=network,
            dependency=dependency,
            log_summary=log_summary,
            executive=ExecutiveSummary(
                summary=[],
                likely_cause="Unknown",
                recommended_owner="Unknown",
            ),
        )

        # ----------------------------------------------------
        # Correlation
        # ----------------------------------------------------

        print("\n========== 5. CORRELATION ==========")

        summary.correlation = self.correlation.analyse(summary)
        if progress_callback:
            progress_callback(65, "Correlating Evidence")

        # ----------------------------------------------------
        # Evidence
        # ----------------------------------------------------

        print("\n========== 6. EVIDENCE ==========")

        summary.evidence = self.evidence.analyse(summary)

        # ----------------------------------------------------
        # Recommendations
        # ----------------------------------------------------
        print("\n========== 7. RECOMMENDATIONS ==========")

        summary.recommendations = self.recommendations.generate(summary)

        if progress_callback:
            progress_callback(75, "Generating Recommendations")

        # ----------------------------------------------------
        # Executive Summary
        # ----------------------------------------------------

        print("\n========== 8. EXECUTIVE SUMMARY ==========")

        summary.executive = await self.executive.investigate(
            summary.deployment,
            summary.logs,
            summary.kubernetes,
            summary.metrics,
            summary.network,
            summary.correlation,
        )

        # ----------------------------------------------------
        # INVESTIGATION RESULT
        # ----------------------------------------------------

        print("\n========== 9. INVESTIGATION RESULT ==========")

        summary.investigation_result = (
            await self.investigation_result.generate(
                summary.correlation,
                summary.evidence,
                summary.executive,
                started_at,
            )
        )

        # ----------------------------------------------------
        # Impact
        # ----------------------------------------------------

        print("\n========== 10. IMPACT ==========")

        summary.impact = await self.impact.investigate(
            summary.context,
            summary.deployment,
            summary.kubernetes,
            summary.dependency,
        )

        # ----------------------------------------------------
        # AI Investigation Reasoner
        # ----------------------------------------------------

        if progress_callback:
            progress_callback(85, "AI Reasoning")

        print("\n========== 11. AI REASONER ==========")

        reasoning = None
        reasoner_started = time.time()

        try:

            summary.ai_result = await self.reasoner.investigate(summary)

            reasoning = summary.ai_result

            duration = time.time() - reasoner_started

            print(
                f"✅ AI Reasoner completed in {duration:.2f} seconds"
            )

        except Exception as ex:

            duration = time.time() - reasoner_started

            print(
                f"❌ AI Reasoner failed after {duration:.2f} seconds"
            )
            print(type(ex).__name__)
            print(ex)

            raise

        print("\n========== AI REASONER OUTPUT ==========")
        print(reasoning)
        print("========================================\n")

        # ----------------------------------------------------
        # Timeline
        # ----------------------------------------------------

        print("\n========== 12. TIMELINE ==========")

        summary.timeline = self.timeline_service.build(
            context=context,
            investigation=summary,
        )

        if progress_callback:
            progress_callback(90, "Building Timeline")


        # ----------------------------------------------------
        # Report
        # ----------------------------------------------------

        completed_at = datetime.now(UTC)
        started_at_dt = datetime.fromtimestamp(started_at, UTC)
        print("\n========== 13. REPORT ==========")
        # ----------------------------------------------------
        # Normalize application / environment
        # ----------------------------------------------------

        import re

        namespace = summary.context.namespace or ""
        application = summary.context.application_name or namespace
        environment = "Unknown"

        match = re.match(
            r"^(.*?)-(dev|qa|uat|prod|stage)$",
            namespace,
            re.IGNORECASE,
        )

        if match:
            application = match.group(1)
            environment = match.group(2)

        print("================================")
        print("Namespace   :", namespace)
        print("Application :", application)
        print("Environment :", environment)
        print("================================")

        summary.report = {
            "executive_summary": {
                "root_cause": summary.executive.likely_cause,
                "business_impact": summary.impact.business_impact,
                "current_status": summary.investigation_result.status,
                "severity": context.priority,
                "owner": summary.executive.recommended_owner,
                "risk": summary.ai_result.business_impact if summary.ai_result else "",
                "summary": summary.executive.summary,
            },
            "ai_investigation": {
                "diagnosis": summary.ai_result.diagnosis,
                "root_cause": {
                    "title": summary.ai_result.root_cause.title,
                    "description": summary.ai_result.root_cause.description,
                },
                "confidence": summary.ai_result.confidence,
                "business_impact": summary.ai_result.business_impact,
                "resolution_plan": summary.ai_result.resolution_plan,
                "prevention": summary.ai_result.prevention,
                "reasoning": summary.ai_result.reasoning,
                "estimated_recovery_time": summary.ai_result.estimated_recovery_time,
                "failure_point": summary.correlation.probable_root_cause,
                "primary_evidence": summary.correlation.findings,
                "alternatives": [],
            },
            "hero": {
                "eyebrow": "AI INVESTIGATION REPORT",
                "short_description": incident.short_description,
                "description": incident.description,

                "application": application,
                "environment": environment,
                "location": getattr(summary.context, "location", ""),

                "confidence": summary.ai_result.confidence,
                "duration": summary.investigation_result.investigation_time,
                "components": 14,
                "eta": summary.ai_result.estimated_recovery_time,
                "generated_at": completed_at.isoformat(),

                "version": f"{settings.app_name} {settings.app_env}",

                "cause": summary.ai_result.root_cause.title,
                "how": summary.ai_result.root_cause.description,
            },
            "technical_investigation": {
                "logs": {
                    "title": "Logs",
                    "summary": summary.logs.assessment.summary,
                    "findings": getattr(summary.logs.assessment, "findings", []),
                },
                "metrics": {
                    "title": "Metrics",
                    "summary": summary.metrics.assessment.summary,
                    "findings": getattr(summary.metrics.assessment, "findings", []),
                },
                "deployment": {
                    "title": "Deployment",
                    "summary": summary.deployment.assessment.summary,
                    "findings": getattr(summary.deployment.assessment, "findings", []),
                },
                "kubernetes": {
                    "title": "Kubernetes",
                    "summary": summary.kubernetes.assessment.summary,
                    "findings": getattr(summary.kubernetes.assessment, "findings", []),
                },
                "network": {
                    "title": "Network",
                    "summary": summary.network.assessment,
                    "findings": [],
                },
                "dependency": {
                    "title": "Dependencies",
                    "summary": summary.dependency.assessment,
                    "findings": [],
                },
            },
            "infrastructure": [
                {
                    "name": "Grafana",
                    "type": "Observability",
                    "status": "Healthy",
                    "metric": "Connected",
                },
                {
                    "name": "Loki",
                    "type": "Logs",
                    "status": "Healthy",
                    "metric": f"{summary.log_summary.total_logs} logs analysed",
                },
                {
                    "name": "Prometheus",
                    "type": "Metrics",
                    "status": "Healthy",
                    "metric": "Metrics collected",
                },
                {
                    "name": "Kubernetes",
                    "type": "Cluster",
                    "status": summary.deployment.health_status,
                    "metric": summary.kubernetes.assessment.summary,
                },
                {
                    "name": "ArgoCD",
                    "type": "Deployment",
                    "status": summary.deployment.sync_status,
                    "metric": summary.deployment.assessment.summary,
                },
                {
                    "name": summary.context.application_name,
                    "type": "Application",
                    "status": summary.deployment.health_status,
                    "metric": summary.deployment.assessment.summary,
                },
            ],
            "timeline": [
                {
                    "time": item.get("time", ""),
                    "title": item.get("event", ""),
                    "description": "",
                    "severity": "Info",
                }
                for item in summary.timeline
            ],
            "recommendations": [
                {
                    "title": rec.action,
                    "description": rec.reason,
                    "priority": rec.priority,
                    "owner": "",
                }
                for rec in summary.recommendations.recommendations
            ],
            "evidence": {
                "primary": [
                    finding
                    for finding in getattr(summary.correlation, "findings", [])
                ],
                "supporting": [
                    evidence
                    for evidence in getattr(summary.evidence, "supporting_evidence", [])
                ],
                "contradictions": [
                    evidence
                    for evidence in getattr(summary.evidence, "contradicting_evidence", [])
                ],
            },
            "recovery": {
                "estimated_time": summary.ai_result.estimated_recovery_time,
                "resolution_plan": summary.ai_result.resolution_plan,
                "prevention": summary.ai_result.prevention,
            },
            "incident": {
                "number": incident.number,
                "short_description": incident.short_description,
                "description": incident.description,
                "priority": context.priority,
                "state": incident.state,

                "application": application,
                "environment": environment,
                "namespace": summary.context.namespace,

                "started_at": started_at_dt.isoformat(),
                "completed_at": completed_at.isoformat(),
                "duration_seconds": summary.investigation_result.investigation_time,
            },
            "footer": {
                "report_id": f"RPT-{incident.number}",
                "generated_at": completed_at.isoformat(),
                "investigation_duration": summary.investigation_result.investigation_time,
                "agent_version": f"{settings.app_name} {settings.app_env}",
            },
        }
        print(summary.report)

        if progress_callback:
            progress_callback(95, "Generating Report")

        print("\n========== INVESTIGATION COMPLETE ==========\n")

        print("Incident sys_id:", incident.sys_id)
        print("Incident number:", incident.number)

        try:
            await self.snow_update.update(
                incident.number,
                summary.report,
            )
        except Exception as e:
            print("\n========== SERVICENOW UPDATE ==========")
            print("⚠️ Failed to update ServiceNow")
            print(type(e).__name__)
            print(e)
            print("Investigation completed successfully.")
            print("=======================================\n")

        return summary
