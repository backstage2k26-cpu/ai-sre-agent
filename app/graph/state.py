from __future__ import annotations

from typing import Any, TypedDict

from app.schemas.incident import Incident
from app.schemas.investigation_summary import InvestigationSummary


class InvestigationState(TypedDict, total=False):
    incident: Incident
    progress_callback: Any
    started_at: float

    context: Any
    discovered: dict | None

    knowledge: Any
    deployment: Any
    logs: Any
    kubernetes: Any
    metrics: Any
    network: Any
    dependency: Any
    pubsub: Any
    log_summary: Any

    summary: InvestigationSummary

    correlation: Any
    evidence: Any
    recommendations: Any
    executive: Any
    investigation_result: Any
    impact: Any
    database_impact: Any
    ai_result: Any
    timeline: Any

    report: dict
    application: str
    environment: str

    error: str | None