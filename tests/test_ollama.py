# tests/test_ollama.py

import asyncio

from app.clients.nvidia_client import NvidiaClient
from app.core.config import settings


async def main():

    client = NvidiaClient()

    response = await client.generate(
        "You are a helpful assistant.",
        "Reply with exactly: Nvidia Working",
        settings.active_model,
    )

    print(response)


asyncio.run(main())