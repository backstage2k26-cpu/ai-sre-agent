from app.clients.gemini_client import GeminiClient
from app.clients.nvidia_client import NvidiaClient
from app.core.config import settings


class LLMClient:

    def __init__(self):

        if settings.llm_provider.lower() == "nvidia":
            self.provider = NvidiaClient()

        elif settings.llm_provider.lower() == "gemini":
            self.provider = GeminiClient()

        else:
            raise ValueError(
                f"Unsupported LLM Provider: {settings.llm_provider}"
            )

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str,
    ):

        return await self.provider.generate(
            system_prompt,
            user_prompt,
            model,
        )

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str,
    ):

        return await self.provider.generate_json(
            system_prompt,
            user_prompt,
            model,
        )