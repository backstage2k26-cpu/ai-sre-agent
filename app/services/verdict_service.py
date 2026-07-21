import time

from app.schemas.verdict import Verdict


class VerdictService:

    async def generate(
        self,
        correlation,
        evidence,
        executive,
        started_at: float,
    ) -> Verdict:

        duration = round(time.time() - started_at, 1)

        return Verdict(
            status="Application Healthy",
            confidence=evidence.overall,
            root_cause=correlation.probable_root_cause,
            owner=executive.recommended_owner,
            investigation_time=f"{duration} sec",
        )