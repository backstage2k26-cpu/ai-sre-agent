from app.clients.pubsub_client import PubSubClient
from app.analyzers.pubsub_analyzer import PubSubAnalyzer
from app.schemas.pubsub_assessment import PubSubAssessment


class PubSubService:

    def __init__(self):
        self.client = PubSubClient()
        self.analyzer = PubSubAnalyzer()

    async def investigate(
        self,
        application_name: str,
    ) -> PubSubAssessment:

        print("\n========== PUBSUB DISCOVERY ==========")
        print("Application :", application_name)

        #
        # 1. Discover Pub/Sub dependency first
        #

        subscriptions = await self.client.discover_subscriptions(
            application_name
        )

        if not subscriptions:

            print("ℹ️ No Pub/Sub dependency discovered.")

            return PubSubAssessment(
                source="Pub/Sub",
                status="SKIPPED",
                severity="LOW",
                confidence=1.0,
                summary="Pub/Sub is not configured for this application.",
                findings=[
                    f"No Pub/Sub topic or subscription was discovered for {application_name}."
                ],
            )

        print(
            f"✅ Found {len(subscriptions)} Pub/Sub subscription(s)"
        )

        #
        # 2. Investigate discovered subscriptions
        #

        assessments = []

        for subscription in subscriptions:

            subscription_name = subscription["subscription"]

            print("\nSubscription :", subscription_name)
            print("Topic        :", subscription["topic"])
            print("State        :", subscription["state"])

            metrics = await self.client.get_subscription_metrics(
                subscription_name
            )

            assessment = self.analyzer.analyse(
                subscription=subscription,
                metrics=metrics,
            )

            assessments.append(assessment)

            print("Backlog      :", assessment.backlog)
            print(
                "Oldest age   :",
                assessment.oldest_unacked_age_seconds,
            )
            print("Status       :", assessment.status)
            print("Severity     :", assessment.severity)
            print("Summary      :", assessment.summary)

        #
        # 3. Return the most important subscription assessment
        #
        # If an application has multiple subscriptions, we don't
        # want a healthy one hiding a problematic one.
        #

        severity_order = {
            "CRITICAL": 4,
            "HIGH": 3,
            "MEDIUM": 2,
            "LOW": 1,
        }

        return max(
            assessments,
            key=lambda item: severity_order.get(
                item.severity,
                0,
            ),
        )

    def skipped_assessment(self) -> PubSubAssessment:

        return PubSubAssessment(
            source="Pub/Sub",
            status="SKIPPED",
            severity="LOW",
            confidence=1.0,
            topic=None,
            subscription=None,
            backlog=0,
            oldest_unacked_age_seconds=0,
            summary=(
                "Pub/Sub investigation skipped because no Pub/Sub "
                "evidence was detected in application logs."
            ),
            findings=[
                "Planner skipped Pub/Sub investigation.",
                "No Pub/Sub related patterns were detected in application logs.",
            ],
        )