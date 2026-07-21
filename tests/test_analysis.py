import asyncio

from app.schemas.incident import Incident
from app.services.analysis_service import AnalysisService


incident = Incident(
    sys_id="123",
    number="INC001245",
    short_description="market-dev service down",
    description="Users are receiving HTTP 503 while accessing Market Service.",
    priority="1",
)


async def main():

    service = AnalysisService()

    context = await service.analyse(incident)

    print()

    print(context.model_dump())

    print()


asyncio.run(main())