from pathlib import Path

from app.clients.llm_client import LLMClient
from app.schemas.incident import Incident
from app.schemas.investigation_summary import InvestigationSummary
from app.core.config import settings


class ReportService:

    def __init__(self):

        self.llm = LLMClient()

        prompt_file = (
            Path(__file__).parent.parent
            / "prompts"
            / "investigation_report.txt"
        )

        self.system_prompt = prompt_file.read_text()

    async def generate(
        self,
        incident: Incident,
        summary: InvestigationSummary,
    ) -> str:

        user_prompt = f"""
================================================================================
INCIDENT
================================================================================

Incident Number:
{incident.number}

Priority:
{incident.priority}

Service:
{summary.context.service_name}

Namespace:
{summary.context.namespace}

Application:
{summary.context.application_name}

Problem Type:
{summary.context.problem_type}

Short Description:
{incident.short_description}

Description:
{incident.description}

Keywords:
{", ".join(summary.context.keywords)}

================================================================================
DEPLOYMENT
================================================================================

Application:
{summary.deployment.application}

Namespace:
{summary.deployment.namespace}

Health:
{summary.deployment.health_status}

Sync Status:
{summary.deployment.sync_status}

Revision:
{summary.deployment.revision}

Image:
{summary.deployment.image_tag}

Deployed At:
{summary.deployment.deployed_at}

Deployed By:
{summary.deployment.deployed_by}

Automated Sync:
{summary.deployment.automated_sync}

Deployment Assessment:
{summary.deployment.assessment.summary}

Deployment Findings:

{chr(10).join(summary.deployment.assessment.findings)}

Deployment History

{chr(10).join(
    f"- {h.deployed_at} | User={h.deployed_by} | Automated={h.automated}"
    for h in summary.deployment.history
)}

================================================================================
LOG ANALYSIS
================================================================================

Errors:
{summary.logs.error_count}

Warnings:
{summary.logs.warning_count}

Assessment:
{summary.logs.assessment.summary}

Findings:

{chr(10).join(summary.logs.assessment.findings)}

Recent Log Entries

{chr(10).join(summary.logs.entries[:10])}

================================================================================
KUBERNETES
================================================================================

Assessment:
{summary.kubernetes.assessment.summary}

Findings:

{chr(10).join(summary.kubernetes.assessment.findings)}

Pods

{chr(10).join(
    f"- {pod['name']} | Phase={pod['phase']} | Ready={pod['ready']} | Restarts={pod['restart_count']} | Node={pod['node']}"
    for pod in summary.kubernetes.pods
)}

Events

{chr(10).join(
    f'''
Time: {event["time"]}
Type: {event["type"]}
Reason: {event["reason"]}
Message:
{event["message"]}
'''
    for event in summary.kubernetes.events
)}

================================================================================
METRICS
================================================================================

Assessment:
{summary.metrics.assessment.summary}

Findings:

{chr(10).join(summary.metrics.assessment.findings)}

================================================================================
KNOWLEDGE BASE
================================================================================

Knowledge Found:
{summary.knowledge.found}

Knowledge Matches

{chr(10).join(
f'''
Title:
{match.title}

Similarity:
{match.similarity}

Status:
{match.status}

Reason:
{match.reason}

Summary:
{match.summary}

Recommendation:
{match.recommendation}
'''
for match in summary.knowledge.matches
)}

================================================================================
CORRELATION
================================================================================

Probable Root Cause:
{summary.correlation.probable_root_cause}

Confidence:
{summary.correlation.confidence}

Supporting Evidence

{chr(10).join(summary.correlation.findings)}

================================================================================
"""

        print("=" * 80)
        print("Generating AI Investigation Report")
        print("Prompt Length:", len(user_prompt))
        print("Logs:", len(summary.logs.entries))
        print("Deployments:", len(summary.deployment.history))
        print("Knowledge Matches:", len(summary.knowledge.matches))
        print("=" * 80)

        try:

            report = await self.llm.generate(
                self.system_prompt,
                user_prompt,
                settings.active_model,
            )

            return report

        except Exception as ex:

            print(f"Report generation failed: {ex}")

            return f"""
# Incident Investigation Report

## Executive Summary

The AI report could not be generated because the configured LLM service was temporarily unavailable.

## Incident

Incident Number: {incident.number}

Priority: {incident.priority}

Service: {summary.context.service_name}

Namespace: {summary.context.namespace}

Application: {summary.context.application_name}

Problem Type: {summary.context.problem_type}

## Deployment

Assessment:

{summary.deployment.assessment.summary}

Findings:

{chr(10).join(f"- {f}" for f in summary.deployment.assessment.findings)}

## Logs

Assessment:

{summary.logs.assessment.summary}

Findings:

{chr(10).join(f"- {f}" for f in summary.logs.assessment.findings)}

## Kubernetes

Assessment:

{summary.kubernetes.assessment.summary}

Findings:

{chr(10).join(f"- {f}" for f in summary.kubernetes.assessment.findings)}

## Metrics

Assessment:

{summary.metrics.assessment.summary}

Findings:

{chr(10).join(f"- {f}" for f in summary.metrics.assessment.findings)}

## Knowledge Base

{chr(10).join(
    f"- {m.title}: {m.recommendation}"
    for m in summary.knowledge.matches
)}

## Correlation

Probable Root Cause:

{summary.correlation.probable_root_cause}

Confidence:

{summary.correlation.confidence}

Supporting Evidence:

{chr(10).join(f"- {f}" for f in summary.correlation.findings)}

## Recommended Actions

- Review Gateway configuration.
- Verify HTTPRoute.
- Verify Service Endpoints.
- Review application logs.
- Validate Kubernetes events.
"""