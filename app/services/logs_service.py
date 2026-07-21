from app.clients.grafana_client import GrafanaClient
from app.schemas.investigation import InvestigationContext
from app.schemas.logs import LogsInfo
from app.schemas.investigation_result import InvestigationResult


class LogsService:

    def __init__(self):
        self.client = GrafanaClient()

    async def investigate(
        self,
        context: InvestigationContext,
    ) -> LogsInfo:

        logs = await self.client.query_logs(
            namespace=context.namespace,
            service=context.namespace,
            minutes=context.search_window_minutes,
        )

        return self._build_logs_info(logs)
    
    def _build_logs_info(
        self,
        logs: list[str],
    ) -> LogsInfo:

        errors = []

        warnings = []

        for line in logs:

            upper = line.upper()

            if "ERROR" in upper or "EXCEPTION" in upper:

                errors.append(line)

            if "WARN" in upper:

                warnings.append(line)

        assessment = self._assess_logs(
            len(errors),
            len(warnings),
        )

        return LogsInfo(

            entries=logs,

            error_count=len(errors),

            warning_count=len(warnings),

            recent_errors=len(errors) > 0,

            assessment=assessment,
        )
    
    def _assess_logs(
        self,
        error_count: int,
        warning_count: int,
    ) -> InvestigationResult:

        findings = []

        confidence = 0.10

        severity = "LOW"

        summary = "Application logs look healthy."

        if error_count:

            findings.append(
                f"{error_count} ERROR log(s) detected."
            )

            confidence += 0.60

        else:

            findings.append(
                "No ERROR logs detected."
            )

        if warning_count:

            findings.append(
                f"{warning_count} WARN log(s) detected."
            )

            confidence += 0.20

        else:

            findings.append(
                "No WARN logs detected."
            )

        if confidence >= 0.80:

            severity = "HIGH"

            summary = "Application logs strongly indicate a runtime failure."

        elif confidence >= 0.50:

            severity = "MEDIUM"

            summary = "Application logs may be related to the incident."

        return InvestigationResult(

            source="Grafana Loki",

            confidence=round(confidence, 2),

            severity=severity,

            summary=summary,

            findings=findings,
        )