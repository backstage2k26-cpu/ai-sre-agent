import asyncio
from pprint import pprint

from app.schemas.investigation import InvestigationContext
from app.services.metrics_service import MetricsService


async def main():

    service = MetricsService()

    result = await service.investigate(
        InvestigationContext(
            incident_number="INC1",
            service_name="Market Service",
            application_name="market-dev",
            namespace="market-dev",
            priority="1",
            problem_type="Deployment Failure",
            keywords=[],
            search_window_minutes=60,
        )
    )

    pprint(result.model_dump())


if __name__ == "__main__":
    asyncio.run(main())