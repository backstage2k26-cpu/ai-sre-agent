import asyncio

from app.schemas.incident import Incident
from app.services.investigation_service import InvestigationService


async def main():

    service = InvestigationService()

    incident = Incident(
        sys_id="TEST001",
        number="INC000001",
        priority="1",
        short_description="Market service is down",
        description="""
        Users cannot access market service.
        Application became unavailable after deployment.
        """,
    )

    result = await service.investigate(
        incident
    )

    print(result.model_dump_json(indent=2))


asyncio.run(main())