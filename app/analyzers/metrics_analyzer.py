from app.schemas.metrics_assessment import MetricsAssessment
from app.schemas.pod_metrics import PodMetrics


class MetricsAnalyzer:

    def analyse(
        self,
        cpu: list,
        memory: list,
        network_rx: list,
        network_tx: list,
    ) -> tuple[list[PodMetrics], MetricsAssessment]:

        pods: dict[str, PodMetrics] = {}

        #
        # CPU
        #
        for item in cpu:

            pod = item["metric"]["pod"]

            latest = float(item["values"][-1][1])

            metric = pods.setdefault(
                pod,
                PodMetrics(pod=pod),
            )

            metric.cpu_millicores = latest * 1000

        #
        # Memory
        #
        for item in memory:

            pod = item["metric"]["pod"]

            latest = float(item["values"][-1][1])

            metric = pods.setdefault(
                pod,
                PodMetrics(pod=pod),
            )

            metric.memory_mb = latest / 1024 / 1024

        #
        # Network RX
        #
        for item in network_rx:

            pod = item["metric"]["pod"]

            latest = float(item["values"][-1][1])

            metric = pods.setdefault(
                pod,
                PodMetrics(pod=pod),
            )

            metric.network_rx_bytes = latest

        #
        # Network TX
        #
        for item in network_tx:

            pod = item["metric"]["pod"]

            latest = float(item["values"][-1][1])

            metric = pods.setdefault(
                pod,
                PodMetrics(pod=pod),
            )

            metric.network_tx_bytes = latest

        findings = []

        severity = "LOW"

        summary = "Resource utilization looks healthy."

        for pod in pods.values():

            findings.append(
                (
                    f"{pod.pod}: "
                    f"CPU={pod.cpu_millicores:.2f}m, "
                    f"Memory={pod.memory_mb:.2f}MB"
                )
            )

            if (
                pod.cpu_millicores
                and pod.cpu_millicores > 800
            ):
                severity = "HIGH"
                summary = "High CPU utilization detected."

            if (
                pod.memory_mb
                and pod.memory_mb > 1500
            ):
                severity = "HIGH"
                summary = "High memory utilization detected."

        assessment = MetricsAssessment(
            source="Prometheus",
            confidence=0.95,
            severity=severity,
            summary=summary,
            findings=findings,
        )

        return list(pods.values()), assessment