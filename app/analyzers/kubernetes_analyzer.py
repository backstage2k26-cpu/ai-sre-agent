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
        # Current Pod Analysis
        # Current state is authoritative.
        #

        unhealthy_pods = False
        restart_warning = False

        for pod in pods:

            pod_name = pod.get("name", "unknown")

            phase = pod.get("phase")
            ready = pod.get("ready", False)
            restart_count = pod.get("restart_count", 0)
            waiting_reason = pod.get("waiting_reason")

            # Highest priority: current crash loop
            if waiting_reason == "CrashLoopBackOff":

                severity = "CRITICAL"
                summary = "Application is crash looping."
                unhealthy_pods = True

                findings.append(
                    f"Pod {pod_name} is currently in CrashLoopBackOff."
                )

                continue

            # Pod currently not running
            if phase != "Running":

                if severity != "CRITICAL":
                    severity = "HIGH"

                summary = "One or more pods are not running."
                unhealthy_pods = True

                findings.append(
                    f"Pod {pod_name} is currently {phase}."
                )

            # Pod currently not ready
            if not ready:

                if severity != "CRITICAL":
                    severity = "HIGH"

                summary = "One or more pods are not Ready."
                unhealthy_pods = True

                findings.append(
                    f"Pod {pod_name} is currently not Ready."
                )

            # Restarts are supporting evidence only.
            # A currently healthy pod should not automatically
            # become unhealthy because it restarted in the past.
            if restart_count > 5:

                restart_warning = True

                findings.append(
                    f"Pod {pod_name} has restarted "
                    f"{restart_count} times historically."
                )

        #
        # No pods returned
        #

        if not pods:

            severity = "MEDIUM"
            confidence = 0.60
            summary = "No application pods were found."

            findings.append(
                "No pods were returned for the investigated workload."
            )

        #
        # Current pods are healthy
        #

        elif not unhealthy_pods:

            severity = "LOW"
            summary = "Pods are currently healthy."

            findings.insert(
                0,
                "All current pods are Running and Ready."
            )

            if restart_warning:
                findings.append(
                    "Historical restarts were detected, "
                    "but the pods are currently healthy."
                )
            else:
                findings.append(
                    "No significant pod restart activity detected."
                )

        #
        # Kubernetes Events
        #
        # Events are supporting evidence.
        # They must NOT override healthy current pod state.
        #

        warning_events = [
            event
            for event in events
            if event.get("type") == "Warning"
        ]

        if warning_events:

            relevant_reasons = {
                "FailedScheduling",
                "FailedMount",
                "ImagePullBackOff",
                "ErrImagePull",
                "CrashLoopBackOff",
                "OOMKilled",
                "BackOff",
                "Unhealthy",
                "Failed",
            }

            for event in warning_events:

                reason = event.get("reason", "")
                message = event.get("message", "")

                if reason in relevant_reasons:

                    findings.append(
                        f"Historical Kubernetes event: "
                        f"{reason}: {message}"
                    )

            #
            # Important:
            # Events only strengthen an already detected
            # current pod problem.
            #

            if unhealthy_pods:

                critical_reasons = {
                    "FailedScheduling",
                    "FailedMount",
                    "ImagePullBackOff",
                    "ErrImagePull",
                    "CrashLoopBackOff",
                    "OOMKilled",
                }

                if any(
                    event.get("reason") in critical_reasons
                    for event in warning_events
                ):
                    severity = "CRITICAL"

        else:

            findings.append(
                "No Kubernetes warning events detected."
            )

        return KubernetesAssessment(
            source="Kubernetes",
            confidence=confidence,
            severity=severity,
            summary=summary,
            findings=findings,
        )