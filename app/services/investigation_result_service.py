import time

from app.schemas.investigation_result import InvestigationResult


class InvestigationResultService:

    async def generate(
        self,
        correlation,
        evidence,
        executive,
        started_at: float,
    ) -> InvestigationResult:

        duration = round(time.time() - started_at, 1)

        if evidence.overall >= 90:
            status = "Confirmed"
        elif evidence.overall >= 70:
            status = "Likely"
        else:
            status = "Inconclusive"

        return InvestigationResult(
            status=status,
            confidence=evidence.overall,
            root_cause=correlation.probable_root_cause,
            owner=executive.recommended_owner,
            investigation_time=f"{duration} sec",
        )