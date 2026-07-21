import json

from ollama import AsyncClient

from app.core.config import settings


class OllamaClient:

    def __init__(self):

        self.client = AsyncClient(
            host=settings.ollama_url,
        )

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str,
    ) -> str:

        response = await self.client.chat(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
        )

        return response["message"]["content"]

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str,
    ):

        text = await self.generate(
            system_prompt,
            user_prompt,
            model,
        )

        text = text.strip()

        if text.startswith("```"):

            lines = text.splitlines()

            if len(lines) > 1:
                text = "\n".join(lines[1:])

            if text.endswith("```"):
                text = text[:-3]

        return json.loads(text.strip())