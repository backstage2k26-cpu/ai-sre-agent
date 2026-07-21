# tests/test_report_llm.py

import asyncio

from app.clients.llm_client import LLMClient
from app.core.config import settings

SYSTEM = """
You are a Senior Site Reliability Engineer.
Write a short incident report.
"""

USER = """
Incident:
Market service is down.

Deployment:
Healthy
Synced

Logs:
No errors
"""

async def main():
    llm = LLMClient()

    result = await llm.generate(
        SYSTEM,
        USER,
        settings.gemini_report_model,
    )

    print(result)

asyncio.run(main())