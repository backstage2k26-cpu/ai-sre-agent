import asyncio

from app.schemas.investigation import InvestigationContext
from app.services.deployment_service import DeploymentService


async def main():

    context = InvestigationContext(
        incident_number="INC001245",
        service_name="market-dev",
        namespace="market",
        problem_type="503",
        priority="1",
        search_window_minutes=60,
        keywords=["market-dev", "503"],
    )

    service = DeploymentService()

    deployment = await service.investigate(
        context
    )

    print()
    print(deployment.model_dump())
    print()


asyncio.run(main())