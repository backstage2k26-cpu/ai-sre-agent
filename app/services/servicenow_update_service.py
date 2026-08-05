from app.clients.servicenow_client import ServiceNowClient
from collections.abc import Iterable


class ServiceNowUpdateService:

    def __init__(self):
        self.client = ServiceNowClient()

    async def update(
        self,
        incident_number: str,
        report: str | dict,
    ):

        incident = await self.client.get_incident_by_number(
            incident_number
        )

        if incident is None:
            print(
                "Incident not found in ServiceNow. Skipping update."
            )
            return

        print("\n========== SERVICENOW UPDATE ==========")
        print(f"Incident Number : {incident_number}")
        print(f"Resolved sys_id : {incident['sys_id']}")
        print("=======================================\n")

        await self.client.update_incident(
            incident["sys_id"],
            {
                "work_notes": report,
            },
        )

        print("✅ ServiceNow incident updated successfully.")

    def format_work_notes(
        self,
        incident_number: str,
        report: str | dict,
    ) -> str:
        if isinstance(report, str):
            return report.strip()

        incident = report.get("incident", {}) if isinstance(report, dict) else {}
        ai_investigation = report.get("ai_investigation", {}) if isinstance(report, dict) else {}
        recovery = report.get("recovery", {}) if isinstance(report, dict) else {}
        executive_summary = report.get("executive_summary", {}) if isinstance(report, dict) else {}
        correlation = report.get("correlation", {}) if isinstance(report, dict) else {}
        evidence = report.get("evidence", {}) if isinstance(report, dict) else {}

        investigation_result = self._first_text(
            [
                ai_investigation.get("root_cause", {}).get("title") if isinstance(ai_investigation.get("root_cause"), dict) else None,
                ai_investigation.get("root_cause", {}).get("description") if isinstance(ai_investigation.get("root_cause"), dict) else None,
                report.get("hero", {}).get("how") if isinstance(report.get("hero"), dict) else None,
                correlation.get("probable_root_cause"),
                executive_summary.get("likely_cause"),
            ]
        )

        root_cause = self._first_text(
            [
                report.get("hero", {}).get("how") if isinstance(report.get("hero"), dict) else None,
                ai_investigation.get("failure_summary"),
                correlation.get("probable_root_cause"),
                investigation_result,
            ]
        )

        evidence_lines = self._normalize_lines(
            evidence.get("primary", [])
            + evidence.get("supporting", [])
            + evidence.get("contradictions", [])
        )

        recommendation = self._first_text(
            [
                self._normalize_lines(recovery.get("resolution_plan", [])),
                self._normalize_lines(ai_investigation.get("resolution_plan", [])),
                self._normalize_lines(ai_investigation.get("prevention", [])),
            ]
        )

        confidence = self._first_text(
            [
                ai_investigation.get("confidence"),
                correlation.get("confidence"),
                report.get("footer", {}).get("confidence") if isinstance(report.get("footer"), dict) else None,
            ]
        )

        lines = [
            "Investigation Result:",
            investigation_result or "Investigation completed.",
            "",
            "Root Cause:",
            root_cause or "-",
            "",
            "Evidence:",
        ]

        if evidence_lines:
            lines.extend([f"• {line}" for line in evidence_lines[:8]])
        else:
            lines.append("• No evidence available.")

        lines.extend(
            [
                "",
                "Recommended Action:",
                recommendation or "-",
                "",
                f"AI Confidence: {confidence or '-'}",
                "",
                "Full investigation details are available in the AI SRE Investigation Report.",
            ]
        )

        return "\n".join(lines).strip()

    def _normalize_lines(self, values: Iterable | None) -> list[str]:
        if not values:
            return []

        lines: list[str] = []
        for value in values:
            if value is None:
                continue
            text = str(value).replace("\r", " ").replace("\n", " ").strip()
            if text:
                lines.append(text)
        return lines

    def _first_text(self, values: Iterable | None) -> str | None:
        if not values:
            return None

        for value in values:
            if value is None:
                continue
            if isinstance(value, list):
                joined = ", ".join(str(item).strip() for item in value if str(item).strip())
                if joined:
                    return joined
                continue

            text = str(value).replace("\r", " ").replace("\n", " ").strip()
            if text and text != "-":
                return text

        return None
