from pathlib import Path

from app.clients.llm_client import LLMClient
from app.core.config import settings
from app.schemas.ai_investigation_result import AIInvestigationResult


class InvestigationReasoner:

    def __init__(self):

        self.llm = LLMClient()

        prompt_file = (
            Path(__file__).parent.parent
            / "prompts"
            / "investigation_reasoner.txt"
        )

        self.system_prompt = prompt_file.read_text()

    async def investigate(self, summary):

        knowledge = []

        for match in summary.knowledge.matches:
            knowledge.append(
                {
                    "title": match.title,
                    "reason": match.reason,
                    "recommendation": match.recommendation,
                }
            )
        log_summary = summary.log_summary
        user_prompt = f"""
Investigation Context

Incident Number:
{summary.context.incident_number}

Application:
{summary.context.application_name}

Namespace:
{summary.context.namespace}

Problem:
{summary.context.problem_type}

Priority:
{summary.context.priority}


Deployment

Health:
{summary.deployment.health_status}

Sync:
{summary.deployment.sync_status}

Summary:
{summary.deployment.assessment.summary}

Deployment Assessment

Confidence:
{summary.deployment.assessment.confidence}

Severity:
{summary.deployment.assessment.severity}

Findings:
{chr(10).join(summary.deployment.assessment.findings)}


Kubernetes

Summary:
{summary.kubernetes.assessment.summary}

Logs

Summary:
{summary.logs.assessment.summary}

Log Summary

Total Logs:
{summary.log_summary.total_logs}

Errors:
{summary.log_summary.error_count}

Warnings:
{summary.log_summary.warning_count}

Exceptions:
{summary.log_summary.exception_count}

Likely Failure:
{summary.log_summary.likely_failure}

First Error:
{summary.log_summary.first_error}

Last Error:
{summary.log_summary.last_error}

Top Errors:
{chr(10).join(summary.log_summary.top_errors)}

Top Exceptions:
{chr(10).join(summary.log_summary.top_exceptions)}

Metrics

Summary:
{summary.metrics.assessment.summary}


Network

Gateway Healthy:
{summary.network.gateway_ok}

Route Healthy:
{summary.network.route_ok}

Endpoint Healthy:
{summary.network.endpoint_ok}

Assessment:
{summary.network.assessment}


Dependencies

Assessment:
{summary.dependency.assessment}


Correlation

Root Cause:
{summary.correlation.probable_root_cause}

Confidence:
{summary.correlation.confidence}

Findings:
{summary.correlation.findings}


Evidence Score

Overall:
{summary.evidence.overall}


Knowledge Base

{knowledge}

IMPORTANT

Return ONLY valid JSON.

Schema:

{{
  "diagnosis": "...",
  "root_cause": "...",
  "confidence": 0,
  "business_impact": "...",
  "resolution_plan": [
    "...",
    "..."
  ],
  "prevention": [
    "...",
    "..."
  ],
  "reasoning": [
    "...",
    "..."
  ],
  "estimated_recovery_time": "..."
}}

Rules:
- Do not return markdown.
- Do not wrap JSON in ``` blocks.
- resolution_plan must be ordered from highest priority.
- prevention should contain long-term improvements.
- reasoning should explain WHY you concluded the root cause.
- confidence must be between 0 and 100.

"""

        print("Reasoner started")
        print(f"Prompt length: {len(user_prompt)}")

        result = await self.llm.generate_json(
            self.system_prompt,
            user_prompt,
            settings.active_model,
        )

        print("Reasoner finished")

        return AIInvestigationResult.model_validate(result)