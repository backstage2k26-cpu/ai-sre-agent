from pathlib import Path

from app.clients.llm_client import LLMClient
from app.schemas.incident import Incident
from app.schemas.investigation import InvestigationContext
from app.core.config import settings
from app.utils.incident_utils import (
    extract_namespace,
    get_search_window,
)


class AnalysisService:

    def __init__(self):

        self.llm = LLMClient()

        prompt_file = (
            Path(__file__).parent.parent
            / "prompts"
            / "incident_parser.txt"
        )

        self.system_prompt = prompt_file.read_text()

    async def analyse(
        self,
        incident: Incident,
    ) -> InvestigationContext:

        user_prompt = f"""
    Incident Number:
    {incident.number}

    Priority:
    {incident.priority}

    Short Description:
    {incident.short_description}

    Description:
    {incident.description}
    """

        result = {}

        for attempt in range(2):
            try:
                print(f"Calling Analysis LLM... (Attempt {attempt + 1})")

                result = await self.llm.generate_json(
                    self.system_prompt,
                    user_prompt,
                    settings.active_model,
                )

                print("Analysis LLM completed")
                break

            except Exception as ex:
                print(f"Analysis LLM failed: {ex}")

                if attempt == 1:
                    print("\n===== USING FALLBACK PARSER =====")

        # Ensure result is always a dictionary
        if not isinstance(result, dict):
            result = {}

        print("\n================ LLM OUTPUT ================")
        print(result)
        print("============================================\n")

        namespace = (
            result.get("namespace")
            or extract_namespace(incident.description)
            or "default"
        )

        application = (
            result.get("application_name")
            or result.get("application")
            or namespace
        )

        service = (
            result.get("service_name")
            or result.get("service")
            or application
        )

        problem = (
            result.get("problem_type")
            or result.get("problem")
            or incident.short_description
        )

        priority = incident.priority or "P3"

        return InvestigationContext(
            incident_number=incident.number,
            service_name=service,
            application_name=application,
            namespace=namespace,
            problem_type=problem,
            priority=priority,
            search_window_minutes=get_search_window(priority),
            keywords=result.get("keywords", []),
        )