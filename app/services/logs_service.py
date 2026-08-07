from app.clients.grafana_client import GrafanaClient
from app.schemas.investigation import InvestigationContext
from app.schemas.logs import LogsInfo
from app.schemas.investigation_assessment import InvestigationAssessment


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
            total_logs=len(logs),
            error_count=len(errors),
            warning_count=len(warnings),
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
        total_logs: int,
        error_count: int,
        warning_count: int,
    ) -> InvestigationAssessment:

        findings = []

        # -----------------------------------------------------
        # No log evidence
        #
        # IMPORTANT:
        # Zero logs must never be interpreted as healthy.
        # It means Loki returned no application log evidence
        # for the investigation window.
        # -----------------------------------------------------

        if total_logs == 0:

            return InvestigationAssessment(
                source="Grafana Loki",
                confidence=0.0,
                severity="UNKNOWN",
                summary=(
                    "No application logs were available "
                    "for the investigation window."
                ),
                findings=[
                    (
                        "Grafana Loki returned 0 application "
                        "log entries."
                    ),
                    (
                        "Application health cannot be determined "
                        "from logs because no log evidence is available."
                    ),
                ],
            )

        # -----------------------------------------------------
        # Logs exist
        # -----------------------------------------------------

        confidence = 0.10
        severity = "LOW"

        summary = "Application logs show no detected runtime errors."

        findings.append(
            f"{total_logs} application log entries analysed."
        )

        # -----------------------------------------------------
        # Errors
        # -----------------------------------------------------

        if error_count:

            findings.append(
                f"{error_count} ERROR log(s) detected."
            )

            confidence += 0.60

        else:

            findings.append(
                "No ERROR logs detected."
            )

        # -----------------------------------------------------
        # Warnings
        # -----------------------------------------------------

        if warning_count:

            findings.append(
                f"{warning_count} WARN log(s) detected."
            )

            confidence += 0.20

        else:

            findings.append(
                "No WARN logs detected."
            )

        # -----------------------------------------------------
        # Severity
        # -----------------------------------------------------

        if confidence >= 0.80:

            severity = "HIGH"

            summary = (
                "Application logs strongly indicate "
                "a runtime failure."
            )

        elif confidence >= 0.50:

            severity = "MEDIUM"

            summary = (
                "Application logs may be related "
                "to the incident."
            )

        return InvestigationAssessment(
            source="Grafana Loki",
            confidence=round(confidence, 2),
            severity=severity,
            summary=summary,
            findings=findings,
        )