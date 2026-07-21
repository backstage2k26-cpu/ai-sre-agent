from app.schemas.evidence_score import EvidenceScore


class EvidenceAnalyzer:

    def analyse(self, summary):

        deployment = 100 if summary.deployment.health_status == "Healthy" else 20

        logs = 100 if summary.logs.error_count == 0 else 40

        kubernetes = (
            100
            if summary.kubernetes.assessment.severity == "LOW"
            else 30
        )

        metrics = (
            100
            if summary.metrics.assessment.severity == "LOW"
            else 40
        )

        network = (
            100
            if summary.network.gateway_ok
            and summary.network.route_ok
            and summary.network.endpoint_ok
            else 40
        )

        knowledge = (
            80
            if summary.knowledge.matches
            else 20
        )

        overall = int(
            (
                deployment +
                logs +
                kubernetes +
                metrics +
                network +
                knowledge
            ) / 6
        )

        return EvidenceScore(
            deployment=deployment,
            logs=logs,
            kubernetes=kubernetes,
            metrics=metrics,
            network=network,
            knowledge=knowledge,
            overall=overall,
        )