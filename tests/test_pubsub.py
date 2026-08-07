import asyncio

from app.clients.pubsub_client import PubSubClient
from app.analyzers.pubsub_analyzer import PubSubAnalyzer


async def main():
    client = PubSubClient()
    analyzer = PubSubAnalyzer()

    application_name = "inventory-batch"

    print("\n========== PUBSUB TEST ==========")
    print(f"Application: {application_name}")

    subscriptions = await client.discover_subscriptions(
        application_name
    )

    if not subscriptions:
        print("No Pub/Sub subscriptions discovered.")
        return

    for subscription in subscriptions:

        subscription_name = subscription["subscription"]

        metrics = await client.get_subscription_metrics(
            subscription_name
        )

        print("\n--- RAW GCP DATA ---")
        print(f"Topic       : {subscription['topic']}")
        print(f"Subscription: {subscription_name}")
        print(f"State       : {subscription['state']}")
        print(f"Backlog     : {metrics['backlog']}")
        print(
            f"Oldest age  : "
            f"{metrics['oldest_unacked_age_seconds']} seconds"
        )
        print(
            f"Ack activity : {metrics['ack_activity']}"
        )

        print(
            f"Backlog trend: "
            f"{metrics['backlog_trend']}"
        )

        print(
            f"Backlog      : "
            f"{metrics['backlog_start']} "
            f"-> {metrics['backlog_end']}"
        )

        print(
            f"Change       : "
            f"{metrics['backlog_change']}"
        )

        print(
            f"Delivery activity   : "
            f"{metrics['delivery_activity']}"
        )

        print(
            f"ACK activity        : "
            f"{metrics['ack_activity']}"
        )

        print(
            f"Expired ACK activity: "
            f"{metrics['expired_ack_activity']}"
        )

        print(
            f"DLQ configured      : "
            f"{subscription.get('dead_letter_configured')}"
        )

        print(
            f"DLQ topic           : "
            f"{subscription.get('dead_letter_topic')}"
        )

        print(
            f"Max delivery attempts: "
            f"{subscription.get('max_delivery_attempts')}"
        )

        assessment = analyzer.analyse(
            subscription=subscription,
            metrics=metrics,
        )

        print("\n--- AGENT ASSESSMENT ---")
        print(f"Status     : {assessment.status}")
        print(f"Severity   : {assessment.severity}")
        print(f"Confidence : {assessment.confidence}")
        print(f"Summary    : {assessment.summary}")

        print("\nFindings:")
        for finding in assessment.findings:
            print(f" - {finding}")

    print("\n=================================")


if __name__ == "__main__":
    asyncio.run(main())