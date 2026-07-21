import asyncio
from pathlib import Path

from app.clients.llm_client import LLMClient
from app.core.config import settings


async def main():

    prompt = (
        Path(__file__).parent.parent
        / "app"
        / "prompts"
        / "incident_parser.txt"
    ).read_text()

    client = LLMClient()

    if settings.llm_provider.lower() == "gemini":
        model = settings.gemini_analysis_model

    elif settings.llm_provider.lower() == "nvidia":
        model = settings.active_model

    else:
        raise ValueError(
            f"Unsupported provider: {settings.llm_provider}"
        )

    result = await client.generate_json(
        system_prompt=prompt,
        model=model,
        user_prompt="""
Incident Number:
INC000001

Priority:
1

Short Description:
Market service is down

Description:
Users cannot access the Market service after deployment.
""",
    )

    print("\n========== RESULT ==========")
    print(result)
    print("============================")


if __name__ == "__main__":
    asyncio.run(main())