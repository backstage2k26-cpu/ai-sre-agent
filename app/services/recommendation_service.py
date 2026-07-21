from app.schemas.recommendation import (
    Recommendation,
    RecommendationSummary,
)


class RecommendationService:

    def generate(self, summary):

        recommendations = []

        if not summary.network.gateway_ok:
            recommendations.append(
                Recommendation(
                    priority=1,
                    action="Verify Gateway configuration.",
                    reason="Gateway is unavailable.",
                )
            )

        if not summary.network.route_ok:
            recommendations.append(
                Recommendation(
                    priority=2,
                    action="Verify HTTPRoute configuration.",
                    reason="Route not found.",
                )
            )

        if not summary.network.endpoint_ok:
            recommendations.append(
                Recommendation(
                    priority=3,
                    action="Verify Service endpoints.",
                    reason="Endpoints unavailable.",
                )
            )

        if summary.logs.error_count > 0:
            recommendations.append(
                Recommendation(
                    priority=4,
                    action="Review application logs.",
                    reason="Errors detected in Loki.",
                )
            )

        if summary.metrics.assessment.severity != "LOW":
            recommendations.append(
                Recommendation(
                    priority=5,
                    action="Investigate resource utilization.",
                    reason="High CPU or Memory usage detected.",
                )
            )

        if (
            summary.deployment.recent_deployment
            and not summary.deployment.automated_sync
        ):
            recommendations.append(
                Recommendation(
                    priority=6,
                    action="Review recent deployment changes.",
                    reason="Incident occurred after a manual deployment.",
                )
            )

        if not recommendations:
            recommendations.append(
                Recommendation(
                    priority=1,
                    action="Verify external connectivity.",
                    reason="Application appears healthy.",
                )
            )

            recommendations.append(
                Recommendation(
                    priority=2,
                    action="Validate Gateway routing.",
                    reason="Traffic may not be reaching the application.",
                )
            )

            recommendations.append(
                Recommendation(
                    priority=3,
                    action="Notify infrastructure team.",
                    reason="No application issues detected.",
                )
            )

        return RecommendationSummary(
            recommendations=sorted(
                recommendations,
                key=lambda r: r.priority,
            ),
            estimated_time="5-10 minutes",
        )