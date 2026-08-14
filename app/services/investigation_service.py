from app.schemas.incident import Incident
from app.schemas.investigation_summary import InvestigationSummary

from app.graph.investigation_graph import build_investigation_graph


class InvestigationService:

    def __init__(self):
        self.graph = build_investigation_graph()

    async def investigate(
        self,
        incident: Incident,
        progress_callback=None,
    ) -> InvestigationSummary:

        print("\n========================================")
        print("      LANGGRAPH INVESTIGATION STARTED")
        print("========================================")

        initial_state = {
            "incident": incident,
            "progress_callback": progress_callback,
        }

        result = await self.graph.ainvoke(initial_state)

        print("\n========================================")
        print("      LANGGRAPH INVESTIGATION COMPLETE")
        print("========================================")

        return result["summary"]