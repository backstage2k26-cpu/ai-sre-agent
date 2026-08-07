from datetime import UTC, datetime, timedelta

from google.cloud import monitoring_v3
from google.cloud import pubsub_v1

from app.core.config import settings


class PubSubClient:

    def __init__(self):
        self.project_id = settings.gcp_project_id

        self.subscriber = pubsub_v1.SubscriberClient()
        self.monitoring = monitoring_v3.MetricServiceClient()

        self.project_name = f"projects/{self.project_id}"

    # ---------------------------------------------------------
    # Discover Pub/Sub subscriptions related to application
    # ---------------------------------------------------------

    async def discover_subscriptions(
        self,
        application_name: str,
    ) -> list[dict]:

        subscriptions = []

        application = application_name.lower()

        for subscription in self.subscriber.list_subscriptions(
            request={"project": self.project_name}
        ):
            subscription_name = subscription.name.split("/")[-1]
            topic_name = subscription.topic.split("/")[-1]

            if (
                application in subscription_name.lower()
                or application in topic_name.lower()
            ):

                # -------------------------------------------------
                # Dead-letter configuration
                # -------------------------------------------------

                dead_letter_topic = None
                max_delivery_attempts = None

                if subscription.dead_letter_policy:

                    if (
                        subscription.dead_letter_policy
                        .dead_letter_topic
                    ):
                        dead_letter_topic = (
                            subscription.dead_letter_policy
                            .dead_letter_topic
                            .split("/")[-1]
                        )

                    max_delivery_attempts = (
                        subscription.dead_letter_policy
                        .max_delivery_attempts
                    )

                subscriptions.append(
                    {
                        "subscription": subscription_name,
                        "topic": topic_name,
                        "state": str(subscription.state.name),

                        "dead_letter_configured": (
                            dead_letter_topic is not None
                        ),

                        "dead_letter_topic": (
                            dead_letter_topic
                        ),

                        "max_delivery_attempts": (
                            max_delivery_attempts
                        ),
                    }
                )

        return subscriptions

    # ---------------------------------------------------------
    # Read latest Cloud Monitoring metric
    # ---------------------------------------------------------

    def _get_latest_metric(
        self,
        metric_type: str,
        subscription_name: str,
    ) -> float | None:

        now = datetime.now(UTC)
        start = now - timedelta(minutes=15)

        interval = monitoring_v3.TimeInterval(
            {
                "end_time": now,
                "start_time": start,
            }
        )

        results = self.monitoring.list_time_series(
            request={
                "name": self.project_name,

                "filter": (
                    f'metric.type="{metric_type}" '
                    'AND '
                    'resource.type="pubsub_subscription" '
                    'AND '
                    f'resource.labels.subscription_id="'
                    f'{subscription_name}"'
                ),

                "interval": interval,

                "view": (
                    monitoring_v3.ListTimeSeriesRequest
                    .TimeSeriesView.FULL
                ),
            }
        )

        latest_value = None
        latest_timestamp = None

        for series in results:

            for point in series.points:

                timestamp = point.interval.end_time
                value = point.value

                if value.int64_value:
                    metric_value = float(
                        value.int64_value
                    )

                else:
                    metric_value = float(
                        value.double_value
                    )

                if (
                    latest_timestamp is None
                    or timestamp > latest_timestamp
                ):
                    latest_timestamp = timestamp
                    latest_value = metric_value

        return latest_value

    # ---------------------------------------------------------
    # Read metric history
    # ---------------------------------------------------------

    def _get_metric_history(
        self,
        metric_type: str,
        subscription_name: str,
        minutes: int = 15,
    ) -> list[dict]:

        now = datetime.now(UTC)
        start = now - timedelta(minutes=minutes)

        interval = monitoring_v3.TimeInterval(
            {
                "end_time": now,
                "start_time": start,
            }
        )

        results = self.monitoring.list_time_series(
            request={
                "name": self.project_name,

                "filter": (
                    f'metric.type="{metric_type}" '
                    'AND '
                    'resource.type="pubsub_subscription" '
                    'AND '
                    f'resource.labels.subscription_id="'
                    f'{subscription_name}"'
                ),

                "interval": interval,

                "view": (
                    monitoring_v3.ListTimeSeriesRequest
                    .TimeSeriesView.FULL
                ),
            }
        )

        points = []

        for series in results:

            for point in series.points:

                value = point.value

                if value.int64_value:
                    metric_value = float(
                        value.int64_value
                    )

                else:
                    metric_value = float(
                        value.double_value
                    )

                points.append(
                    {
                        "timestamp": (
                            point.interval.end_time
                        ),
                        "value": metric_value,
                    }
                )

        points.sort(
            key=lambda item: item["timestamp"]
        )

        return points

    # ---------------------------------------------------------
    # ACK activity
    # ---------------------------------------------------------

    def _get_ack_activity(
        self,
        subscription_name: str,
    ) -> float:

        points = self._get_metric_history(
            "pubsub.googleapis.com/"
            "subscription/ack_message_count",
            subscription_name,
            minutes=15,
        )

        if not points:
            return 0.0

        return sum(
            point["value"]
            for point in points
        )

    # ---------------------------------------------------------
    # Message delivery activity
    # ---------------------------------------------------------

    def _get_delivery_activity(
        self,
        subscription_name: str,
    ) -> float:

        points = self._get_metric_history(
            "pubsub.googleapis.com/"
            "subscription/sent_message_count",
            subscription_name,
            minutes=15,
        )

        if not points:
            return 0.0

        return sum(
            point["value"]
            for point in points
        )

    # ---------------------------------------------------------
    # Expired ACK deadline activity
    # ---------------------------------------------------------

    def _get_expired_ack_activity(
        self,
        subscription_name: str,
    ) -> float:

        points = self._get_metric_history(
            "pubsub.googleapis.com/"
            "subscription/expired_ack_deadlines_count",
            subscription_name,
            minutes=15,
        )

        if not points:
            return 0.0

        return sum(
            point["value"]
            for point in points
        )

    # ---------------------------------------------------------
    # Backlog trend
    # ---------------------------------------------------------

    def _get_backlog_trend(
        self,
        subscription_name: str,
    ) -> dict:

        points = self._get_metric_history(
            "pubsub.googleapis.com/"
            "subscription/num_undelivered_messages",
            subscription_name,
            minutes=15,
        )

        if len(points) < 2:

            return {
                "start": None,
                "end": None,
                "change": 0,
                "trend": "UNKNOWN",
            }

        start = points[0]["value"]
        end = points[-1]["value"]

        change = end - start

        if change > 0:
            trend = "GROWING"

        elif change < 0:
            trend = "DECREASING"

        else:
            trend = "STABLE"

        return {
            "start": int(start),
            "end": int(end),
            "change": int(change),
            "trend": trend,
        }

    # ---------------------------------------------------------
    # Collect complete subscription evidence
    # ---------------------------------------------------------

    async def get_subscription_metrics(
        self,
        subscription_name: str,
    ) -> dict:

        # -----------------------------------------------------
        # Current backlog
        # -----------------------------------------------------

        backlog = self._get_latest_metric(
            "pubsub.googleapis.com/"
            "subscription/num_undelivered_messages",
            subscription_name,
        )

        # -----------------------------------------------------
        # Oldest unacknowledged message
        # -----------------------------------------------------

        oldest_age = self._get_latest_metric(
            "pubsub.googleapis.com/"
            "subscription/oldest_unacked_message_age",
            subscription_name,
        )

        # -----------------------------------------------------
        # ACK activity
        # -----------------------------------------------------

        ack_activity = self._get_ack_activity(
            subscription_name
        )

        # -----------------------------------------------------
        # Delivery activity
        # -----------------------------------------------------

        delivery_activity = (
            self._get_delivery_activity(
                subscription_name
            )
        )

        # -----------------------------------------------------
        # Expired ACK deadlines
        # -----------------------------------------------------

        expired_ack_activity = (
            self._get_expired_ack_activity(
                subscription_name
            )
        )

        # -----------------------------------------------------
        # Backlog trend
        # -----------------------------------------------------

        backlog_trend = (
            self._get_backlog_trend(
                subscription_name
            )
        )

        # -----------------------------------------------------
        # Return raw evidence
        # -----------------------------------------------------

        return {
            "backlog": int(
                backlog or 0
            ),

            "oldest_unacked_age_seconds": float(
                oldest_age or 0
            ),

            "ack_activity": float(
                ack_activity or 0
            ),

            "delivery_activity": float(
                delivery_activity or 0
            ),

            "expired_ack_activity": float(
                expired_ack_activity or 0
            ),

            "backlog_start": (
                backlog_trend["start"]
            ),

            "backlog_end": (
                backlog_trend["end"]
            ),

            "backlog_change": (
                backlog_trend["change"]
            ),

            "backlog_trend": (
                backlog_trend["trend"]
            ),
        }