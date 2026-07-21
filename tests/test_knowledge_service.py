import asyncio

from app.schemas.investigation import InvestigationContext
from app.services.knowledge_service import KnowledgeService


async def main():

    context = InvestigationContext(
        incident_number="INC000001",
        service_name="Market Service",
        application_name="market-dev",
        namespace="market-dev",
        priority="1",
        problem_type="Deployment Failure",
        search_window_minutes=60,
        keywords=[
            "deployment",
            "service unavailable",
            "healthy pods",
        ],
    )

    service = KnowledgeService()

    result = await service.search(context)

    print(result.model_dump())


asyncio.run(main())