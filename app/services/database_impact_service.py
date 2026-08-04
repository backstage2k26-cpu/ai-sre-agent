from __future__ import annotations

import re

from app.schemas.database_impact import DatabaseImpact


class DatabaseImpactService:

    DB_NAME_PATTERN = re.compile(
        r"(postgres|postgre|mysql|mariadb|mongodb|mongo|redis|kafka|rabbitmq|elastic|opensearch|oracle|sql server|mssql|aurora|db|database)",
        re.IGNORECASE,
    )

    FAILURE_PATTERN = re.compile(
        r"(timeout|timed out|connection refused|connect error|sql|query failed|deadlock|replication lag|out of memory|oom|failed to connect|endpoint.*not ready|no such host|authentication failed)",
        re.IGNORECASE,
    )

    async def investigate(self, context, deployment, logs, metrics, dependency) -> DatabaseImpact:
        db_candidates = self._discover_databases(context, deployment, dependency)
        db_name = db_candidates[0] if db_candidates else self._default_db_name(context)
        evidence = self._collect_evidence(logs, metrics, dependency)

        db_health = self._assess_database_health(dependency, evidence)
        direction = self._infer_direction(context, deployment, logs, metrics, dependency, db_health)
        affected_services = self._infer_affected_services(context, deployment, dependency, direction, db_health)

        score = "100%" if db_health == "healthy" else "0%"
        metric = self._build_metric_text(db_health, evidence)
        summary = self._build_summary(db_name, db_health, direction, affected_services)

        return DatabaseImpact(
            database_name=db_name,
            database_type="Database",
            status="Investigated" if db_candidates else "Skipped",
            metric=metric,
            score=score,
            direction=direction,
            affected_services=affected_services,
            evidence=evidence[:5],
            summary=summary,
        )

    def _discover_databases(self, context, deployment, dependency) -> list[str]:
        candidates: list[str] = []

        for value in [
            getattr(context, "service_name", None),
            getattr(context, "application_name", None),
            getattr(context, "normalized_service", None),
            getattr(deployment, "application", None),
        ]:
            if value and self.DB_NAME_PATTERN.search(str(value)):
                candidates.append(str(value))

        for item in getattr(dependency, "dependencies", []) or []:
            name = getattr(item, "name", "") or ""
            if self.DB_NAME_PATTERN.search(name):
                candidates.append(name)

        return list(dict.fromkeys(candidates))

    def _default_db_name(self, context) -> str:
        service = getattr(context, "service_name", None) or getattr(context, "application_name", None) or "database"
        return f"Database for {service}"

    def _collect_evidence(self, logs, metrics, dependency) -> list[str]:
        evidence: list[str] = []

        for entry in getattr(logs, "entries", []) or []:
            text = str(entry)
            if self.FAILURE_PATTERN.search(text):
                evidence.append(text)

        for item in getattr(dependency, "dependencies", []) or []:
            name = getattr(item, "name", "")
            message = getattr(item, "message", "")
            if name:
                evidence.append(f"Dependency {name}: {message}")

        assessment = getattr(getattr(metrics, "assessment", None), "summary", None)
        if assessment:
            evidence.append(str(assessment))

        return evidence

    def _assess_database_health(self, dependency, evidence: list[str]) -> str:
        db_dependencies = [
            item for item in (getattr(dependency, "dependencies", []) or [])
            if self.DB_NAME_PATTERN.search(getattr(item, "name", "") or "")
        ]

        if not db_dependencies:
            return "unknown"

        healthy_dependencies = [item for item in db_dependencies if getattr(item, "healthy", False)]
        if healthy_dependencies and len(healthy_dependencies) == len(db_dependencies):
            return "healthy"

        if any(self.FAILURE_PATTERN.search(item) for item in evidence):
            return "degraded"

        return "unhealthy"

    def _infer_direction(self, context, deployment, logs, metrics, dependency, db_health: str) -> str:
        deployment_bad = str(getattr(deployment, "health_status", "")).lower() not in {"healthy", "ok"}
        log_text = " ".join(getattr(logs, "entries", []) or []).lower()
        metrics_text = str(getattr(getattr(metrics, "assessment", None), "summary", "")).lower()
        db_related_errors = bool(self.FAILURE_PATTERN.search(log_text) or self.FAILURE_PATTERN.search(metrics_text))
        db_present = any(
            self.DB_NAME_PATTERN.search(getattr(item, "name", "") or "")
            for item in (getattr(dependency, "dependencies", []) or [])
        )

        if db_present and (db_health in {"unhealthy", "degraded"} or db_related_errors):
            return "db_caused_service_issue"

        if deployment_bad and not db_related_errors:
            return "service_caused_db_issue"

        if db_present and deployment_bad:
            return "service_caused_db_issue"

        return "unknown"

    def _infer_affected_services(self, context, deployment, dependency, direction: str, db_health: str) -> list[str]:
        if direction == "db_caused_service_issue":
            service = getattr(context, "service_name", None) or getattr(context, "application_name", None)
            return [service] if service else []

        if direction == "service_caused_db_issue":
            service = getattr(context, "service_name", None) or getattr(context, "application_name", None)
            return [service] if service else []

        db_services = [
            getattr(item, "name", "")
            for item in (getattr(dependency, "dependencies", []) or [])
            if self.DB_NAME_PATTERN.search(getattr(item, "name", "") or "")
        ]
        return [service for service in db_services if service]

    def _build_metric_text(self, db_health: str, evidence: list[str]) -> str:
        if db_health == "healthy":
            return "Database reachable and healthy"
        if db_health == "degraded":
            return "Database showing degraded signals"
        if db_health == "unhealthy":
            return "Database unavailable or failing"
        if evidence:
            return evidence[0]
        return "No database-specific signals found"

    def _build_summary(self, db_name: str, db_health: str, direction: str, affected_services: list[str]) -> str:
        service_text = ", ".join(affected_services) if affected_services else "no dependent services identified"
        return f"{db_name} assessed as {db_health}. Direction: {direction}. Affected services: {service_text}."
