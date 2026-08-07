from app.schemas.logs import LogsInfo
from app.schemas.planner_result import PlannerResult


class PubSubPlanner:

    PATTERNS = [
        "pubsubexception",
        "failed to acknowledge",
        "ack deadline exceeded",
        "deadlineexceeded",
        "subscriber failed",
        "failed to publish",
        "unable to publish",
        "unable to acknowledge",
        "resource_exhausted",
        "pubsub",
    ]

    def plan(
        self,
        logs: LogsInfo,
    ) -> PlannerResult:

        matches = []

        for line in logs.entries:

            text = line.lower()

            for pattern in self.PATTERNS:

                if pattern in text:
                    matches.append(pattern)

        matches = list(set(matches))

        if not matches:

            return PlannerResult(
                pubsub=False,
                reason="No Pub/Sub evidence found in application logs.",
                confidence=0.0,
            )

        confidence = min(
            0.60 + len(matches) * 0.10,
            0.95,
        )

        return PlannerResult(
            pubsub=True,
            reason="Pub/Sub related log patterns detected.",
            confidence=confidence,
        )