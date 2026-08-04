from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.incident_service import IncidentService

from app.repositories.investigation_repository import (
    InvestigationRepository,
)
from app.schemas.similar_incident import SimilarIncident


class SimilarIncidentService:

    def __init__(
        self,
        repository: InvestigationRepository,
    ):
        self.repository = repository

        self.incident_service = IncidentService()

        self.model = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2"
        )

    async def find_similar_incidents(
        self,
        investigation_id: str,
        limit: int = 3,
    ) -> list[SimilarIncident]:

        # -----------------------------------------
        # Get current investigation
        # -----------------------------------------

        current = self.repository.find_by_id(
            investigation_id
        )

        if current is None:
            raise ValueError(
                f"Investigation '{investigation_id}' not found"
            )

        current_report = current.report or {}

        current_root_cause = self._extract_root_cause(
            current_report
        )

        if not current_root_cause:
            return []

        print("\n========== SIMILAR INCIDENT SEARCH ==========")
        print("Current incident:", current.incident_number)
        print("Current root cause:", current_root_cause)

        # -----------------------------------------
        # Historical completed investigations
        # -----------------------------------------

        completed = self.repository.get_completed()

        candidates = []

        # Track ServiceNow incident numbers already included
        seen_incidents = set()

        for investigation in completed:

            # -----------------------------------------
            # Never compare investigation with itself
            # -----------------------------------------

            if (
                investigation.investigation_id
                == investigation_id
            ):
                continue

            # -----------------------------------------
            # Never return current ServiceNow incident
            # -----------------------------------------

            if (
                investigation.incident_number
                == current.incident_number
            ):
                continue

            # -----------------------------------------
            # Only one investigation per incident
            # -----------------------------------------

            if investigation.incident_number in seen_incidents:
                continue

            report = investigation.report or {}

            historical_root_cause = (
                self._extract_root_cause(report)
            )

            if not historical_root_cause:
                continue

            seen_incidents.add(
                investigation.incident_number
            )

            candidates.append(
                {
                    "investigation": investigation,
                    "report": report,
                    "root_cause": historical_root_cause,
                }
            )

        if not candidates:
            print("No historical candidates found.")
            print("============================================\n")
            return []

        # -----------------------------------------
        # Semantic similarity
        # -----------------------------------------

        root_causes = [
            current_root_cause,
            *[
                candidate["root_cause"]
                for candidate in candidates
            ],
        ]

        embeddings = self.model.encode(
            root_causes,
            normalize_embeddings=True,
        )

        scores = cosine_similarity(
            [embeddings[0]],
            embeddings[1:],
        )[0]

        results = []

        for candidate, score in zip(
            candidates,
            scores,
        ):
            investigation = candidate["investigation"]
            report = candidate["report"]

            similarity = float(score)
            incident_status = await self._get_servicenow_status(
                investigation.incident_number
            )

            # Ignore weak/unrelated incidents
            if similarity < 0.45:
                continue

            result = SimilarIncident(
                incident=investigation.incident_number,
                application=self._extract_application(
                    report
                ),
                root_cause=candidate["root_cause"],
                resolution=self._extract_resolution(
                    investigation,
                    report,
                ),
                status=incident_status,
                similarity=round(similarity, 2),
            )

            results.append(result)

            print(
                f"{investigation.incident_number}: "
                f"{similarity:.2f}"
            )

        # Highest similarity first
        results.sort(
            key=lambda item: item.similarity,
            reverse=True,
        )

        print("Returned:", len(results[:limit]))
        print("============================================\n")

        return results[:limit]

    # -------------------------------------------------
    # Report extraction helpers
    # -------------------------------------------------

    def _extract_root_cause(
        self,
        report: dict,
    ) -> str:

        value = self._get_nested_value(
            report,
            [
                ["ai_result", "root_cause"],
                ["investigation_result", "root_cause"],
                ["root_cause"],
            ],
        )

        return str(value).strip() if value else ""

    def _extract_application(
        self,
        report: dict,
    ) -> str:

        value = self._get_nested_value(
            report,
            [
                ["application_name"],
                ["application"],
                ["context", "application_name"],
                ["investigation_result", "application"],
            ],
        )

        return str(value).strip() if value else "Unknown"

    def _extract_incident_status(
        self,
        report: dict,
    ) -> str:

        value = self._get_nested_value(
            report,
            [
                ["incident_status"],
                ["incident", "status"],
                ["incident", "state"],
            ],
        )

        return str(value).strip() if value else "Unknown"

    def _extract_resolution(
        self,
        investigation,
        report: dict,
    ) -> str:

        # Prefer actual investigation duration
        if (
            investigation.started_at
            and investigation.completed_at
        ):
            seconds = (
                investigation.completed_at
                - investigation.started_at
            ).total_seconds()

            return self._format_duration(seconds)

        value = self._get_nested_value(
            report,
            [
                ["investigation_result", "investigation_time"],
                ["ai_result", "estimated_recovery_time"],
            ],
        )

        return str(value).strip() if value else "—"

    def _format_duration(
        self,
        seconds: float,
    ) -> str:

        if seconds < 60:
            return f"{round(seconds)}s"

        minutes = int(seconds // 60)

        if minutes < 60:
            return f"{minutes}m"

        hours = minutes // 60
        remaining_minutes = minutes % 60

        if remaining_minutes:
            return f"{hours}h {remaining_minutes}m"

        return f"{hours}h"

    def _get_nested_value(
        self,
        data: dict,
        paths: list[list[str]],
    ):

        for path in paths:

            current = data

            for key in path:

                if (
                    not isinstance(current, dict)
                    or key not in current
                ):
                    current = None
                    break

                current = current[key]

            if current is not None:
                return current

        return None
    
    async def _get_servicenow_status(
        self,
        incident_number: str,
    ) -> str:

        try:
            incident = await self.incident_service.fetch_by_number(
                incident_number
            )

            state = str(incident.state).strip()

            state_map = {
                "1": "New",
                "2": "In Progress",
                "3": "On Hold",
                "6": "Resolved",
                "7": "Closed",
                "8": "Canceled",
            }

            return state_map.get(
                state,
                state if state else "Unknown",
            )

        except Exception as ex:
            print(
                f"Failed to fetch ServiceNow status for "
                f"{incident_number}: {ex}"
            )

            return "Unknown"