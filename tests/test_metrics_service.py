import asyncio
from pprint import pprint

from app.schemas.investigation import InvestigationContext
from app.services.metrics_service import MetricsService


async def main():

    service = MetricsService()

    context = InvestigationContext(
        incident_number="INC1",
        service_name="market",
        namespace="market-dev",
        problem_type="application issue",
        priority="P2",
        search_window_minutes=60,
        keywords=["market", "application"],
        application_name="market",
        argocd_application="market",
        normalized_service="market",
    )

    print("\n========================================")
    print("       METRICS SERVICE TEST")
    print("========================================")

    print("\n--- INVESTIGATION CONTEXT ---")
    pprint(context.model_dump())

    print("\n--- RUNNING METRICS INVESTIGATION ---")

    result = await service.investigate(context)

    print("\n--- METRICS RESULT ---")
    pprint(result.model_dump())

    print("\n========================================")
    print("       TEST COMPLETE")
    print("========================================")


if __name__ == "__main__":
    asyncio.run(main())