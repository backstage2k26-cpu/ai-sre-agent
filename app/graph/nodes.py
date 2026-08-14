from __future__ import annotations

import asyncio
import re
import time
from datetime import datetime, UTC

from app.graph.state import InvestigationState
from app.schemas.executive_summary import ExecutiveSummary
from app.schemas.investigation_summary import InvestigationSummary

from app.services.analysis_service import AnalysisService
from app.services.deployment_service import DeploymentService
from app.services.logs_service import LogsService
from app.services.kubernetes_service import KubernetesService
from app.services.metrics_service import MetricsService
from app.services.knowledge_service import KnowledgeService
from app.services.network_service import NetworkService
from app.services.dependency_service import DependencyService
from app.services.database_impact_service import DatabaseImpactService
from app.services.recommendation_service import RecommendationService
from app.services.executive_summary_service import ExecutiveSummaryService
from app.services.investigation_result_service import InvestigationResultService
from app.services.impact_service import ImpactService
from app.services.timeline_service import TimelineService
from app.services.investigation_reasoner import InvestigationReasoner
from app.services.servicenow_update_service import ServiceNowUpdateService

from app.verifiers.knowledge_verifier import KnowledgeVerifier

from app.analyzers.correlation_analyzer import CorrelationAnalyzer
from app.analyzers.evidence_analyzer import EvidenceAnalyzer
from app.analyzers.log_analyzer import LogAnalyzer

from app.clients.kubernetes_client import KubernetesClient
from app.services.pubsub_service import PubSubService
from app.planner.pubsub_planner import PubSubPlanner

from app.core.config import settings
from app.repositories.incident_repository import IncidentRepository
from app.database.session import SessionLocal


# ============================================================
# Existing services
# ============================================================

class InvestigationGraphServices:

    def __init__(self):

        self.analysis = AnalysisService()
        self.deployments = DeploymentService()
        self.logs = LogsService()
        self.kubernetes = KubernetesService()
        self.metrics = MetricsService()
        self.knowledge = KnowledgeService()
        self.network = NetworkService()
        self.dependency = DependencyService()
        self.database_impact = DatabaseImpactService()

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

        self.kubernetes_client = KubernetesClient()

        self.pubsub = PubSubService()
        self.pubsub_planner = PubSubPlanner()

        self.snow_update = ServiceNowUpdateService()

        self.db = SessionLocal()
        self.incident_repo = IncidentRepository(self.db)


services = InvestigationGraphServices()


# ============================================================
# Helpers
# ============================================================

def _progress(state: InvestigationState, progress: int, step: str):

    callback = state.get("progress_callback")

    if callback:
        callback(progress, step)


# ============================================================
# NODE 1 — Build Context
# ============================================================

async def build_context_node(
    state: InvestigationState,
) -> dict:

    print("\n========== LANGGRAPH: 1. BUILD CONTEXT ==========")

    incident = state["incident"]

    context = await services.analysis.analyse(incident)

    return {
        "context": context,
        "started_at": time.time(),
    }


# ============================================================
# NODE 2 — Kubernetes Resource Discovery
# ============================================================

async def discover_resources_node(
    state: InvestigationState,
) -> dict:

    print("\n========== LANGGRAPH: KUBERNETES RESOURCE DISCOVERY ==========")

    context = state["context"]

    application_name = context.application_name
    discovered = None

    environment = ""

    namespace_lower = (
        context.namespace or ""
    ).lower()

    application_lower = (
        application_name or ""
    ).lower()

    for candidate in (
        "dev",
        "qa",
        "uat",
        "stage",
        "prod",
    ):

        if (
            namespace_lower == candidate
            or namespace_lower.endswith(f"-{candidate}")
            or application_lower.endswith(f"-{candidate}")
        ):

            environment = candidate
            break

    print("AI Application :", application_name)
    print("AI Namespace   :", context.namespace)
    print("Environment    :", environment)

    if application_name and environment:

        discovered = (
            await services.kubernetes_client
            .discover_application_resources(
                application_name=application_name,
                environment=environment,
            )
        )

        if discovered:

            print("✅ Kubernetes resources discovered")
            print("Namespace  :", discovered["namespace"])
            print("Deployment :", discovered["deployment"])
            print("Service    :", discovered["service"])
            print("Selector   :", discovered["pod_selector"])

            context.namespace = discovered["namespace"]

        else:

            print(
                "⚠️ No matching Kubernetes resources found for",
                application_name,
                environment,
            )

    else:

        print(
            "⚠️ Could not determine application/environment "
            "for Kubernetes discovery"
        )

    print("===================================================\n")

    return {
        "context": context,
        "discovered": discovered,
        "application": application_name,
        "environment": environment,
    }


# ============================================================
# NODE 3 — Update Normalized Service
# ============================================================

async def update_service_node(
    state: InvestigationState,
) -> dict:

    print("\n========== LANGGRAPH: UPDATE SERVICE ==========")

    incident = state["incident"]
    context = state["context"]

    print("Application :", context.application_name)
    print("Namespace   :", context.namespace)
    print(
        "Normalized  :",
        getattr(context, "normalized_service", None),
    )

    if getattr(context, "normalized_service", None):

        services.incident_repo.update_service(
            incident_number=incident.number,
            service=context.normalized_service,
        )

        print(
            f"Updated service -> "
            f"{context.normalized_service}"
        )

    else:

        print("normalized_service is empty")

    return {}


# ============================================================
# NODE 4 — Collect Evidence
# ============================================================

async def collect_evidence_node(
    state: InvestigationState,
) -> dict:

    print("\n========== LANGGRAPH: 2. COLLECT EVIDENCE ==========")

    context = state["context"]

    (
        knowledge,
        deployment,
        logs,
        kubernetes,
        metrics,
        network,
        dependency,
    ) = await asyncio.gather(

        services.knowledge.search(context),

        services.deployments.investigate(context),

        services.logs.investigate(context),

        services.kubernetes.investigate(context),

        services.metrics.investigate(context),

        services.network.investigate(context),

        services.dependency.investigate(context),
    )

    print("\n========== DEPLOYMENT ==========")

    print(
        f"Application : {deployment.application}"
    )

    print(
        f"Namespace   : {deployment.namespace}"
    )

    print(
        f"Health      : {deployment.health_status}"
    )

    print(
        f"Sync        : {deployment.sync_status}"
    )

    print(
        f"Revision    : {deployment.revision}"
    )

    print(
        f"Recent      : {deployment.recent_deployment}"
    )

    print(
        f"Automated   : {deployment.automated_sync}"
    )

    print(
        f"Phase       : {deployment.operation_phase}"
    )

    print(
        f"Assessment  : {deployment.assessment.summary}"
    )

    _progress(
        state,
        40,
        "Collecting Evidence",
    )

    return {
        "knowledge": knowledge,
        "deployment": deployment,
        "logs": logs,
        "kubernetes": kubernetes,
        "metrics": metrics,
        "network": network,
        "dependency": dependency,
    }


# ============================================================
# NODE 5 — Pub/Sub + Log Analysis
# ============================================================

async def analyze_logs_node(
    state: InvestigationState,
) -> dict:

    print("\n========== LANGGRAPH: PUBSUB / LOG ANALYSIS ==========")

    context = state["context"]
    logs = state["logs"]

    planner = services.pubsub_planner.plan(logs)

    if planner.pubsub:

        print("\n========== PUBSUB ==========")
        print("Planner selected Pub/Sub investigation")

        pubsub = await services.pubsub.investigate(
            context.application_name
        )

    else:

        print("\n========== PUBSUB ==========")
        print("Planner skipped Pub/Sub investigation")

        pubsub = services.pubsub.skipped_assessment()

    print("\n========== PUBSUB ==========")

    print(f"Status       : {pubsub.status}")
    print(f"Severity     : {pubsub.severity}")
    print(f"Topic        : {pubsub.topic}")
    print(f"Subscription : {pubsub.subscription}")
    print(f"Backlog      : {pubsub.backlog}")

    print(
        f"Oldest Age   : "
        f"{pubsub.oldest_unacked_age_seconds}"
    )

    print(f"Summary      : {pubsub.summary}")

    for finding in pubsub.findings:

        print(
            f"Finding      : {finding}"
        )

    log_summary = services.log_analyzer.analyse(
        logs
    )

    print("\n========== LOG SUMMARY ==========")

    print(
        f"Total Logs     : "
        f"{log_summary.total_logs}"
    )

    print(
        f"Errors         : "
        f"{log_summary.error_count}"
    )

    print(
        f"Warnings       : "
        f"{log_summary.warning_count}"
    )

    print(
        f"Exceptions     : "
        f"{log_summary.exception_count}"
    )

    print(
        f"CrashLoop      : "
        f"{log_summary.crashloop_count}"
    )

    print(
        f"OOMKilled      : "
        f"{log_summary.oom_count}"
    )

    print(
        f"Timeouts       : "
        f"{log_summary.timeout_count}"
    )

    print(
        f"ImagePull      : "
        f"{log_summary.imagepull_count}"
    )

    print(
        f"Likely Failure : "
        f"{log_summary.likely_failure}"
    )

    return {
        "pubsub": pubsub,
        "log_summary": log_summary,
    }


# ============================================================
# NODE 6 — Verify Knowledge
# ============================================================

async def verify_knowledge_node(
    state: InvestigationState,
) -> dict:

    print(
        "\n========== "
        "LANGGRAPH: 3. VERIFY KNOWLEDGE "
        "=========="
    )

    knowledge = services.knowledge_verifier.verify(

        state["knowledge"],

        state["deployment"],

        state["logs"],

        state["kubernetes"],

        state["metrics"],
    )

    _progress(
        state,
        55,
        "Verifying Knowledge",
    )

    return {
        "knowledge": knowledge,
    }


# ============================================================
# NODE 7 — Build Summary
# ============================================================

async def build_summary_node(
    state: InvestigationState,
) -> dict:

    print(
        "\n========== "
        "LANGGRAPH: 4. BUILD SUMMARY "
        "=========="
    )

    summary = InvestigationSummary(

        context=state["context"],

        knowledge=state["knowledge"],

        deployment=state["deployment"],

        logs=state["logs"],

        kubernetes=state["kubernetes"],

        metrics=state["metrics"],

        network=state["network"],

        dependency=state["dependency"],

        pubsub=state["pubsub"],

        log_summary=state["log_summary"],

        executive=ExecutiveSummary(
            summary=[],
            likely_cause="Unknown",
            recommended_owner="Unknown",
        ),
    )

    return {
        "summary": summary,
    }


# ============================================================
# NODE 8 — Correlation
# ============================================================

async def correlation_node(
    state: InvestigationState,
) -> dict:

    print(
        "\n========== "
        "LANGGRAPH: 5. CORRELATION "
        "=========="
    )

    summary = state["summary"]

    summary.correlation = (
        services.correlation.analyse(summary)
    )

    _progress(
        state,
        65,
        "Correlating Evidence",
    )

    return {
        "summary": summary,
        "correlation": summary.correlation,
    }


# ============================================================
# NODE 9 — Evidence
# ============================================================

async def evidence_node(
    state: InvestigationState,
) -> dict:

    print(
        "\n========== "
        "LANGGRAPH: 6. EVIDENCE "
        "=========="
    )

    summary = state["summary"]

    summary.evidence = (
        services.evidence.analyse(summary)
    )

    return {
        "summary": summary,
        "evidence": summary.evidence,
    }


# ============================================================
# NODE 10 — Recommendations
# ============================================================

async def recommendations_node(
    state: InvestigationState,
) -> dict:

    print(
        "\n========== "
        "LANGGRAPH: 7. RECOMMENDATIONS "
        "=========="
    )

    summary = state["summary"]

    summary.recommendations = (
        services.recommendations.generate(summary)
    )

    _progress(
        state,
        75,
        "Generating Recommendations",
    )

    return {
        "summary": summary,
        "recommendations": summary.recommendations,
    }


# ============================================================
# NODE 11 — Executive Summary
# ============================================================

async def executive_summary_node(
    state: InvestigationState,
) -> dict:

    print(
        "\n========== "
        "LANGGRAPH: 8. EXECUTIVE SUMMARY "
        "=========="
    )

    summary = state["summary"]

    summary.executive = (
        await services.executive.investigate(

            summary.deployment,

            summary.logs,

            summary.kubernetes,

            summary.metrics,

            summary.network,

            summary.correlation,
        )
    )

    return {
        "summary": summary,
        "executive": summary.executive,
    }


# ============================================================
# NODE 12 — Investigation Result
# ============================================================

async def investigation_result_node(
    state: InvestigationState,
) -> dict:

    print(
        "\n========== "
        "LANGGRAPH: 9. INVESTIGATION RESULT "
        "=========="
    )

    summary = state["summary"]

    summary.investigation_result = (
        await services.investigation_result.generate(

            summary.correlation,

            summary.evidence,

            summary.executive,

            state["started_at"],
        )
    )

    return {
        "summary": summary,
        "investigation_result": (
            summary.investigation_result
        ),
    }


# ============================================================
# NODE 13 — Impact
# ============================================================

async def impact_node(
    state: InvestigationState,
) -> dict:

    print(
        "\n========== "
        "LANGGRAPH: 10. IMPACT "
        "=========="
    )

    summary = state["summary"]

    summary.impact = await services.impact.investigate(

        summary.context,

        summary.deployment,

        summary.kubernetes,

        summary.dependency,
    )

    return {
        "summary": summary,
        "impact": summary.impact,
    }


# ============================================================
# NODE 14 — Database Impact
# ============================================================

async def database_impact_node(
    state: InvestigationState,
) -> dict:

    print(
        "\n========== "
        "LANGGRAPH: DATABASE IMPACT "
        "=========="
    )

    summary = state["summary"]

    summary.database_impact = (
        await services.database_impact.investigate(

            summary.context,

            summary.deployment,

            summary.logs,

            summary.metrics,

            summary.dependency,
        )
    )

    return {
        "summary": summary,
        "database_impact": summary.database_impact,
    }


# ============================================================
# NODE 15 — AI Reasoner
# ============================================================

async def ai_reasoner_node(
    state: InvestigationState,
) -> dict:

    _progress(
        state,
        85,
        "AI Reasoning",
    )

    print(
        "\n========== "
        "LANGGRAPH: 11. AI REASONER "
        "=========="
    )

    summary = state["summary"]

    reasoner_started = time.time()

    try:

        summary.ai_result = (
            await services.reasoner.investigate(
                summary
            )
        )

        duration = (
            time.time() - reasoner_started
        )

        print(
            f"✅ AI Reasoner completed in "
            f"{duration:.2f} seconds"
        )

    except Exception as ex:

        duration = (
            time.time() - reasoner_started
        )

        print(
            f"❌ AI Reasoner failed after "
            f"{duration:.2f} seconds"
        )

        print(
            type(ex).__name__
        )

        print(ex)

        raise

    print(
        "\n========== AI REASONER OUTPUT =========="
    )

    print(summary.ai_result)

    print(
        "========================================\n"
    )

    return {
        "summary": summary,
        "ai_result": summary.ai_result,
    }


# ============================================================
# NODE 16 — Timeline
# ============================================================

async def timeline_node(
    state: InvestigationState,
) -> dict:

    print(
        "\n========== "
        "LANGGRAPH: 12. TIMELINE "
        "=========="
    )

    summary = state["summary"]

    summary.timeline = (
        services.timeline_service.build(

            context=summary.context,

            investigation=summary,
        )
    )

    _progress(
        state,
        90,
        "Building Timeline",
    )

    return {
        "summary": summary,
        "timeline": summary.timeline,
    }


# ============================================================
# NODE 17 — Report
# ============================================================

async def report_node(
    state: InvestigationState,
) -> dict:

    print(
        "\n========== "
        "LANGGRAPH: 13. REPORT "
        "=========="
    )

    summary = state["summary"]
    incident = state["incident"]
    discovered = state.get("discovered")

    completed_at = datetime.now(UTC)

    started_at_dt = datetime.fromtimestamp(
        state["started_at"],
        UTC,
    )

    namespace = (
        summary.context.namespace or ""
    )

    application = (
        summary.context.application_name
        or namespace
    )

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
        "kubernetes_resources": {
            "namespace": (
                discovered.get("namespace")
                if discovered
                else summary.context.namespace
            ),

            "deployment": (
                discovered.get("deployment")
                if discovered
                else None
            ),

            "service": (
                discovered.get("service")
                if discovered
                else None
            ),

            "pod_selector": (
                discovered.get(
                    "pod_selector",
                    {},
                )
                if discovered
                else {}
            ),
        },

        "executive_summary": {
            "root_cause": (
                summary.executive.likely_cause
            ),

            "business_impact": (
                summary.impact.business_impact
            ),

            "current_status": (
                summary.investigation_result.status
            ),

            "severity": (
                summary.context.priority
            ),

            "owner": (
                summary.executive.recommended_owner
            ),

            "risk": (
                summary.ai_result.business_impact
                if summary.ai_result
                else ""
            ),

            "summary": (
                summary.executive.summary
            ),
        },

        "ai_investigation": {
            "diagnosis": (
                summary.ai_result.diagnosis
            ),

            "root_cause": {
                "title": (
                    summary.ai_result
                    .root_cause
                    .title
                ),

                "description": (
                    summary.ai_result
                    .root_cause
                    .description
                ),
            },

            "confidence": (
                summary.ai_result.confidence
            ),

            "business_impact": (
                summary.ai_result.business_impact
            ),

            "resolution_plan": (
                summary.ai_result.resolution_plan
            ),

            "prevention": (
                summary.ai_result.prevention
            ),

            "reasoning": (
                summary.ai_result.reasoning
            ),

            "estimated_recovery_time": (
                summary.ai_result
                .estimated_recovery_time
            ),

            "failure_point": (
                summary.correlation
                .probable_root_cause
            ),

            "primary_evidence": (
                summary.correlation.findings
            ),

            "alternatives": [],
        },

        "hero": {
            "eyebrow":
                "AI INVESTIGATION REPORT",

            "short_description":
                incident.short_description,

            "description":
                incident.description,

            "application":
                application,

            "environment":
                environment,

            "location":
                getattr(
                    summary.context,
                    "location",
                    "",
                ),

            "confidence":
                summary.ai_result.confidence,

            "duration":
                summary.investigation_result
                .investigation_time,

            "components":
                14,

            "eta":
                summary.ai_result
                .estimated_recovery_time,

            "generated_at":
                completed_at.isoformat(),

            "version":
                f"{settings.app_name} "
                f"{settings.app_env}",

            "cause":
                summary.ai_result
                .root_cause.title,

            "how":
                summary.ai_result
                .root_cause.description,
        },

        "incident": {
            "number": incident.number,

            "short_description":
                incident.short_description,

            "description":
                incident.description,

            "priority":
                summary.context.priority,

            "state":
                incident.state,

            "application":
                application,

            "environment":
                environment,

            "namespace":
                summary.context.namespace,

            "started_at":
                started_at_dt.isoformat(),

            "completed_at":
                completed_at.isoformat(),

            "duration_seconds":
                summary.investigation_result
                .investigation_time,
        },

        "timeline": [
            {
                "time":
                    item.get("time", ""),

                "title":
                    item.get("event", ""),

                "description":
                    "",

                "severity":
                    "Info",
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

            for rec in (
                summary
                .recommendations
                .recommendations
            )
        ],

        "evidence": {
            "primary": [
                finding
                for finding in getattr(
                    summary.correlation,
                    "findings",
                    [],
                )
            ],

            "supporting": [
                evidence
                for evidence in getattr(
                    summary.evidence,
                    "supporting_evidence",
                    [],
                )
            ],

            "contradictions": [
                evidence
                for evidence in getattr(
                    summary.evidence,
                    "contradicting_evidence",
                    [],
                )
            ],
        },

        "recovery": {
            "estimated_time":
                summary.ai_result
                .estimated_recovery_time,

            "resolution_plan":
                summary.ai_result
                .resolution_plan,

            "prevention":
                summary.ai_result
                .prevention,
        },

        "footer": {
            "report_id":
                f"RPT-{incident.number}",

            "generated_at":
                completed_at.isoformat(),

            "investigation_duration":
                summary.investigation_result
                .investigation_time,

            "agent_version":
                f"{settings.app_name} "
                f"{settings.app_env}",
        },
    }

    print(
        "\n========== REPORT KUBERNETES RESOURCES =========="
    )

    print(
        summary.report.get(
            "kubernetes_resources"
        )
    )

    print(
        "=================================================\n"
    )

    if state.get("progress_callback"):

        _progress(
            state,
            95,
            "Generating Report",
        )

    return {
        "summary": summary,
        "report": summary.report,
        "application": application,
        "environment": environment,
    }


# ============================================================
# NODE 18 — ServiceNow Update
# ============================================================

async def servicenow_update_node(
    state: InvestigationState,
) -> dict:

    print(
        "\n========== "
        "LANGGRAPH: SERVICENOW UPDATE "
        "=========="
    )

    incident = state["incident"]
    report = state["summary"].report

    print(
        "Incident sys_id:",
        incident.sys_id,
    )

    print(
        "Incident number:",
        incident.number,
    )

    try:

        work_notes = (
            services.snow_update
            .format_work_notes(
                incident.number,
                report,
            )
        )

        await services.snow_update.update(
            incident.number,
            work_notes,
        )

    except Exception as e:

        print(
            "\n========== "
            "SERVICENOW UPDATE "
            "=========="
        )

        print(
            "⚠️ Failed to update ServiceNow"
        )

        print(
            type(e).__name__
        )

        print(e)

        print(
            "Investigation completed successfully."
        )

        print(
            "=======================================\n"
        )

    print(
        "\n========== "
        "LANGGRAPH INVESTIGATION COMPLETE "
        "=========="
    )

    return {
        "summary": state["summary"],
    }