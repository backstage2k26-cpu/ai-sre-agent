from app.schemas.metrics_assessment import MetricsAssessment


class MetricsAnalyzer:

    def analyse(
        self,
        cpu: dict,
        memory: dict,
    ) -> MetricsAssessment:

        findings = []

        severity = "LOW"
        confidence = 0.95
        summary = "Resource utilization looks healthy."

        cpu_results = cpu["data"]["result"]
        memory_results = memory["data"]["result"]

        if cpu_results:

            cpu_cores = float(
                cpu_results[0]["value"][1]
            )

            cpu_millicores = cpu_cores * 1000

            findings.append(
                f"CPU Usage: {cpu_millicores:.2f} mCPU"
            )

            if cpu_millicores > 800:

                severity = "HIGH"

                summary = "High CPU utilization detected."

            elif cpu_millicores > 500:

                severity = "MEDIUM"

                summary = "Moderate CPU utilization detected."

        else:

            findings.append(
                "CPU metrics unavailable."
            )

        if memory_results:

            memory_bytes = float(
                memory_results[0]["value"][1]
            )

            memory_mb = (
                memory_bytes
                / 1024
                / 1024
            )

            findings.append(
                f"Memory Usage: {memory_mb:.2f} MB"
            )

            if memory_mb > 1500:

                severity = "HIGH"

                summary = "High memory utilization detected."

            elif memory_mb > 1000 and severity != "HIGH":

                severity = "MEDIUM"

                summary = "Moderate memory utilization detected."

        else:

            findings.append(
                "Memory metrics unavailable."
            )

        if severity == "LOW":

            findings.append(
                "No resource pressure detected."
            )

        return MetricsAssessment(
            source="Prometheus",
            confidence=confidence,
            severity=severity,
            summary=summary,
            findings=findings,
        )