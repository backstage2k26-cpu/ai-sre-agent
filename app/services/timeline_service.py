from datetime import datetime, timedelta


class TimelineService:

    def build(self, context, investigation):

        start = datetime.now()

        timeline = []

        def add(seconds: int, event: str):
            timeline.append(
                {
                    "time": (
                        start + timedelta(seconds=seconds)
                    ).strftime("%H:%M:%S"),
                    "event": event,
                }
            )

        # ----------------------------------------------------
        # Investigation Started
        # ----------------------------------------------------

        add(
            0,
            f"Incident {context.incident_number} received from ServiceNow",
        )

        add(
            1,
            f"Application identified as '{context.application_name}'",
        )

        # ----------------------------------------------------
        # Deployment
        # ----------------------------------------------------

        add(
            2,
            investigation.deployment.assessment.summary,
        )

        # ----------------------------------------------------
        # Kubernetes
        # ----------------------------------------------------

        add(
            3,
            investigation.kubernetes.assessment.summary,
        )

        # ----------------------------------------------------
        # Logs
        # ----------------------------------------------------

        add(
            4,
            investigation.logs.assessment.summary,
        )

        # ----------------------------------------------------
        # Metrics
        # ----------------------------------------------------

        add(
            5,
            investigation.metrics.assessment.summary,
        )

        # ----------------------------------------------------
        # Network
        # ----------------------------------------------------

        add(
            6,
            investigation.network.assessment,
        )

        # ----------------------------------------------------
        # Dependencies
        # ----------------------------------------------------

        add(
            7,
            investigation.dependency.assessment,
        )

        # ----------------------------------------------------
        # Knowledge Base
        # ----------------------------------------------------

        add(
            8,
            (
                investigation.knowledge.matches[0].reason
                if investigation.knowledge.matches
                else "No matching knowledge base article found."
            ),
        )

        # ----------------------------------------------------
        # Correlation
        # ----------------------------------------------------

        add(
            9,
            f"Root cause identified: {investigation.correlation.probable_root_cause}",
        )

        # ----------------------------------------------------
        # Investigation Completed
        # ----------------------------------------------------

        add(
            10,
            "Investigation completed successfully.",
        )

        return timeline