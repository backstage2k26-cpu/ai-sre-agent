from app.schemas.kubernetes_assessment import KubernetesAssessment


class KubernetesAnalyzer:

    def analyse(
        self,
        pods: list[dict],
        events: list[dict],
    ) -> KubernetesAssessment:

        findings = []

        severity = "LOW"

        confidence = 0.95

        summary = "Pods are healthy."

        #
        # Pod Analysis
        #

        for pod in pods:

            if pod.get("phase") != "Running":

                severity = "HIGH"

                summary = "One or more pods are not running."

                findings.append(
                    f'Pod {pod["name"]} is {pod["phase"]}.'
                )

            if not pod["ready"]:

                severity = "HIGH"

                summary = "One or more pods are not Ready."

                findings.append(
                    f'Pod {pod["name"]} is not Ready.'
                )

            if pod["restart_count"] > 5:

                if severity != "HIGH":
                    severity = "MEDIUM"

                summary = "Pods have restarted multiple times."

                findings.append(
                    f'Pod {pod["name"]} restarted '
                    f'{pod["restart_count"]} times.'
                )
            waiting_reason = pod.get("waiting_reason")

            if waiting_reason == "CrashLoopBackOff":

                severity = "CRITICAL"

                summary = "Application is crash looping."

                findings.append(
                    f'Pod {pod["name"]} is in CrashLoopBackOff.'
                )

        #
        # Event Analysis
        #
        critical_reasons = {
            "FailedScheduling",
            "FailedMount",
            "ImagePullBackOff",
            "ErrImagePull",
            "CrashLoopBackOff",
            "OOMKilled",
        }

        high_reasons = {
            "BackOff",
            "Unhealthy",
            "Failed",
        }

        warning_events = [
            event
            for event in events
            if event.get("type") == "Warning"
        ]

        if warning_events:

            for event in warning_events:

                reason = event.get("reason", "")
                message = event.get("message", "")

                findings.append(f"{reason}: {message}")

                if reason in critical_reasons:

                    severity = "CRITICAL"
                    summary = f"Kubernetes detected {reason}."

                elif (
                    reason in high_reasons
                    and severity != "CRITICAL"
                ):

                    severity = "HIGH"
                    summary = f"Kubernetes detected {reason}."

            if severity == "LOW":

                severity = "MEDIUM"
                summary = "Kubernetes warning events detected."

        else:

            findings.append(
                "No Kubernetes warning events detected."
            )

        #
        # Healthy Cluster
        #

        if (
            severity == "LOW"
            and summary == "Pods are healthy."
        ):

            findings.insert(
                0,
                "All pods are Running.",
            )

            findings.insert(
                1,
                "All containers are Ready.",
            )

            findings.insert(
                2,
                "No restarts detected.",
            )

        return KubernetesAssessment(
            source="Kubernetes",
            confidence=confidence,
            severity=severity,
            summary=summary,
            findings=findings,
        )