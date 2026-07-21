import asyncio
from pprint import pprint

from app.schemas.investigation import InvestigationContext
from app.services.kubernetes_service import KubernetesService


async def main():

    service = KubernetesService()

    context = InvestigationContext(
        incident_number="INC000001",
        service_name="Market Service",
        application_name="market-dev",
        namespace="market-dev",
        problem_type="Deployment Failure",
        priority="1",
        search_window_minutes=60,
        keywords=["market"],
    )

    result = await service.investigate(
        context,
    )

    pprint(result.model_dump())


asyncio.run(main())