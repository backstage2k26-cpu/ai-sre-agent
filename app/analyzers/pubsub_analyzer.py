from app.schemas.pubsub_assessment import PubSubAssessment


class PubSubAnalyzer:

    def analyse(
        self,
        subscription: dict,
        metrics: dict,
    ) -> PubSubAssessment:

        topic = subscription.get("topic")
        subscription_name = subscription.get("subscription")
        state = subscription.get("state", "UNKNOWN")

        backlog = int(metrics.get("backlog") or 0)

        oldest_age = float(
            metrics.get("oldest_unacked_age_seconds") or 0
        )

        ack_activity = float(
            metrics.get("ack_activity") or 0
        )

        delivery_activity = float(
            metrics.get("delivery_activity") or 0
        )

        expired_ack_activity = float(
            metrics.get("expired_ack_activity") or 0
        )

        backlog_start = metrics.get("backlog_start")
        backlog_end = metrics.get("backlog_end")

        backlog_change = int(
            metrics.get("backlog_change") or 0
        )

        backlog_trend = metrics.get(
            "backlog_trend",
            "UNKNOWN",
        )

        dead_letter_configured = bool(
            subscription.get(
                "dead_letter_configured",
                False,
            )
        )

        dead_letter_topic = subscription.get(
            "dead_letter_topic"
        )

        max_delivery_attempts = subscription.get(
            "max_delivery_attempts"
        )

        findings = []

        severity = "LOW"
        status = "HEALTHY"
        confidence = 0.90

        summary = "Pub/Sub is operating normally."

        # -----------------------------------------------------
        # Subscription state
        # -----------------------------------------------------

        if state != "ACTIVE":

            status = "PROBLEM"
            severity = "HIGH"
            confidence = 0.95

            summary = (
                "Pub/Sub subscription is not active."
            )

            findings.append(
                f"Subscription state is {state}."
            )

        else:

            findings.append(
                "Subscription is ACTIVE."
            )

        # -----------------------------------------------------
        # Current backlog
        # -----------------------------------------------------

        if backlog == 0:

            findings.append(
                "No undelivered messages detected."
            )

        else:

            findings.append(
                f"{backlog} undelivered messages detected."
            )

        # -----------------------------------------------------
        # Oldest message age
        # -----------------------------------------------------

        if oldest_age > 0:

            findings.append(
                "Oldest unacknowledged message is "
                f"{int(oldest_age)} seconds old."
            )

        # -----------------------------------------------------
        # Backlog trend
        # -----------------------------------------------------

        if (
            backlog_start is not None
            and backlog_end is not None
        ):

            findings.append(
                "Backlog trend: "
                f"{backlog_start} -> {backlog_end} "
                f"({backlog_trend})."
            )

        elif backlog > 0:

            findings.append(
                f"Backlog trend is {backlog_trend}."
            )

        # -----------------------------------------------------
        # Delivery activity
        # -----------------------------------------------------

        if delivery_activity > 0:

            findings.append(
                "Message delivery activity detected "
                f"in the observation window: "
                f"{delivery_activity}."
            )

        elif backlog > 0:

            findings.append(
                "No message delivery activity detected "
                "in the observation window."
            )

        # -----------------------------------------------------
        # ACK activity
        # -----------------------------------------------------

        if ack_activity > 0:

            findings.append(
                "Subscriber ACK activity detected "
                f"in the observation window: "
                f"{ack_activity}."
            )

        elif backlog > 0:

            findings.append(
                "No subscriber ACK activity detected "
                "in the observation window."
            )

        # -----------------------------------------------------
        # Expired ACK deadlines
        # -----------------------------------------------------

        if expired_ack_activity > 0:

            findings.append(
                "Expired ACK deadlines detected: "
                f"{expired_ack_activity}."
            )

        # -----------------------------------------------------
        # Dead-letter configuration
        # -----------------------------------------------------

        if dead_letter_configured:

            finding = (
                "Dead-letter policy is configured"
            )

            if dead_letter_topic:
                finding += (
                    f" with topic {dead_letter_topic}"
                )

            if max_delivery_attempts:
                finding += (
                    f" and max delivery attempts "
                    f"{max_delivery_attempts}"
                )

            findings.append(
                finding + "."
            )

        else:

            findings.append(
                "No dead-letter topic is configured."
            )

        # =====================================================
        # CORRELATION RULES
        # =====================================================
        #
        # Important:
        #
        # A backlog by itself is NOT enough to declare failure.
        #
        # We look for combinations:
        #
        # backlog
        # + old messages
        # + no ACKs
        # + no deliveries
        # + stable/growing backlog
        #
        # =====================================================

        # -----------------------------------------------------
        # Rule 1
        # Subscription itself unavailable
        # -----------------------------------------------------

        if state != "ACTIVE":

            status = "PROBLEM"
            severity = "HIGH"
            confidence = 0.95

            summary = (
                "Pub/Sub subscription is unavailable "
                "or not active."
            )

        # -----------------------------------------------------
        # Rule 2
        # Strong subscriber processing failure
        # -----------------------------------------------------

        elif (
            backlog > 0
            and oldest_age >= 1800
            and ack_activity == 0
            and delivery_activity == 0
            and backlog_trend in (
                "STABLE",
                "GROWING",
            )
        ):

            status = "PROBLEM"
            severity = "HIGH"
            confidence = 0.95

            summary = (
                "Pub/Sub messages appear to not be "
                "processed by the subscriber."
            )

            findings.append(
                "The combination of old queued messages, "
                "no delivery activity, no ACK activity, "
                "and a non-decreasing backlog indicates "
                "possible subscriber processing failure."
            )

        # -----------------------------------------------------
        # Rule 3
        # Large and growing backlog
        # -----------------------------------------------------

        elif (
            backlog >= 1000
            and backlog_trend == "GROWING"
        ):

            status = "PROBLEM"
            severity = "CRITICAL"
            confidence = 0.95

            summary = (
                "Pub/Sub backlog is large and growing."
            )

            findings.append(
                "Message production appears to exceed "
                "subscriber processing capacity."
            )

        # -----------------------------------------------------
        # Rule 4
        # Significant processing delay
        # -----------------------------------------------------

        elif (
            backlog >= 100
            and oldest_age >= 300
        ):

            status = "PROBLEM"
            severity = "HIGH"
            confidence = 0.90

            summary = (
                "Pub/Sub message processing is delayed."
            )

        # -----------------------------------------------------
        # Rule 5
        # Expired ACK deadlines
        # -----------------------------------------------------

        elif expired_ack_activity > 0:

            status = "WARNING"
            severity = "MEDIUM"
            confidence = 0.90

            summary = (
                "Pub/Sub subscriber is experiencing "
                "ACK deadline expirations."
            )

            findings.append(
                "Messages may be taking too long to process "
                "or may be getting redelivered."
            )

        # -----------------------------------------------------
        # Rule 6
        # Old messages but insufficient failure evidence
        # -----------------------------------------------------

        elif (
            backlog > 0
            and oldest_age >= 1800
        ):

            status = "WARNING"
            severity = "MEDIUM"
            confidence = 0.85

            summary = (
                "Pub/Sub contains old unacknowledged "
                "messages."
            )

        # -----------------------------------------------------
        # Rule 7
        # Small backlog with active processing
        # -----------------------------------------------------

        elif backlog > 0:

            if (
                ack_activity > 0
                or delivery_activity > 0
                or backlog_trend == "DECREASING"
            ):

                status = "HEALTHY"
                severity = "LOW"
                confidence = 0.90

                summary = (
                    "Pub/Sub has queued messages, but "
                    "subscriber processing is active."
                )

            else:

                status = "WARNING"
                severity = "LOW"
                confidence = 0.80

                summary = (
                    "Pub/Sub has queued messages with "
                    "limited recent processing activity."
                )

        # -----------------------------------------------------
        # Rule 8
        # No backlog
        # -----------------------------------------------------

        else:

            status = "HEALTHY"
            severity = "LOW"
            confidence = 0.95

            summary = (
                "Pub/Sub is operating normally."
            )

        return PubSubAssessment(
            source="Pub/Sub",
            status=status,
            severity=severity,
            confidence=confidence,
            topic=topic,
            subscription=subscription_name,
            backlog=backlog,
            oldest_unacked_age_seconds=oldest_age,
            summary=summary,
            findings=findings,
        )