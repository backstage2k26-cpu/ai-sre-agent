from app.schemas.impact_summary import ImpactSummary


class ImpactService:

    async def investigate(
        self,
        context,
        deployment,
        kubernetes,
        dependency,
    ):

        # Availability
        availability = (
            "99.99%"
            if deployment.health_status.lower() == "healthy"
            else "Unavailable"
        )

        # Blast Radius
        blast_radius = (
            "LOW"
            if deployment.health_status.lower() == "healthy"
            else "HIGH"
        )

        # User Impact
        user_impact = (
            "Minimal"
            if deployment.health_status.lower() == "healthy"
            else "Service Degraded"
        )

        # Business Impact
        business_impact = (
            "Low"
            if deployment.health_status.lower() == "healthy"
            else "High"
        )

        # Healthy dependency count
        healthy = sum(
            1
            for d in dependency.dependencies
            if d.healthy
        )

        affected_pods = (
            kubernetes.assessment.summary
            if kubernetes.assessment
            else "Unknown"
        )

        return ImpactSummary(
            affected_service=context.service_name,
            user_impact=user_impact,
            availability=availability,
            blast_radius=blast_radius,
            affected_pods=affected_pods,
            dependent_services=[
                d.name for d in dependency.dependencies
            ],
            business_impact=business_impact,
        )