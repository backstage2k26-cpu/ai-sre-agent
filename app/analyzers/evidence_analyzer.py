from app.schemas.evidence_score import EvidenceScore


class EvidenceAnalyzer:

    def analyse(self, summary):

        # -----------------------------------------------------
        # Deployment
        # -----------------------------------------------------

        deployment = (
            100
            if summary.deployment.health_status == "Healthy"
            else 20
        )

        # -----------------------------------------------------
        # Logs
        #
        # IMPORTANT:
        # 0 logs = no evidence.
        # Do not score missing logs as healthy.
        # -----------------------------------------------------

        total_logs = len(summary.logs.entries)

        logs_available = total_logs > 0

        if logs_available:

            logs = (
                100
                if summary.logs.error_count == 0
                else 40
            )

        else:

            # Keep numeric compatibility with EvidenceScore,
            # but exclude this value from the overall score.
            logs = 0

        # -----------------------------------------------------
        # Kubernetes
        # -----------------------------------------------------

        kubernetes = (
            100
            if summary.kubernetes.assessment.severity == "LOW"
            else 30
        )

        # -----------------------------------------------------
        # Metrics
        # -----------------------------------------------------

        metrics = (
            100
            if summary.metrics.assessment.severity == "LOW"
            else 40
        )

        # -----------------------------------------------------
        # Network
        # -----------------------------------------------------

        network = (
            100
            if (
                summary.network.gateway_ok
                and summary.network.route_ok
                and summary.network.endpoint_ok
            )
            else 40
        )

        # -----------------------------------------------------
        # Knowledge
        # -----------------------------------------------------

        knowledge = (
            80
            if summary.knowledge.matches
            else 20
        )

        # -----------------------------------------------------
        # Calculate overall score using only available evidence
        # -----------------------------------------------------

        evidence_scores = [
            deployment,
            kubernetes,
            metrics,
            network,
            knowledge,
        ]

        if logs_available:
            evidence_scores.append(logs)

        overall = int(
            sum(evidence_scores)
            / len(evidence_scores)
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