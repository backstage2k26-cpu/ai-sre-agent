import asyncio

from app.schemas.incident import Incident
from app.services.investigation_service import InvestigationService
from app.services.report_service import ReportService


async def main():

    incident = Incident(
        sys_id="TEST001",
        number="INC000001",
        priority="1",
        short_description="Market service is down",
        description="Users cannot access Market service after deployment."
    )

    investigation = InvestigationService()
    report_service = ReportService()

    summary = await investigation.investigate(incident)

    report = await report_service.generate(
        incident,
        summary,
    )

    print(report)


asyncio.run(main())