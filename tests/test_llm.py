import asyncio

from app.clients.llm_client import LLMClient


async def main():
    client = LLMClient()

    response = await client.generate(
        system_prompt="You are a helpful DevOps assistant.",
        user_prompt="Say hello in one sentence."
    )

    print(response)


asyncio.run(main())