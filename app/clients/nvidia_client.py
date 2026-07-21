from openai import AsyncOpenAI
import json

from app.core.config import settings


class NvidiaClient:

    def __init__(self):

        self.client = AsyncOpenAI(
            api_key=settings.nvidia_api_key,
            base_url="https://integrate.api.nvidia.com/v1",
            timeout=120,
        )

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str,
    ) -> str:

        print("\n========== NVIDIA GENERATE ==========")
        print(f"Model: {model}")

        response = await self.client.chat.completions.create(
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
            temperature=0.2,
            max_tokens=2048,
        )

        content = response.choices[0].message.content or ""

        print("========== NVIDIA RESPONSE ==========")
        print(content)
        print("=====================================\n")

        return content

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str,
    ):

        print("\n========== NVIDIA JSON REQUEST ==========")
        print(f"Model: {model}")
        print(f"Prompt Length: {len(user_prompt)}")
        print("Sending request to NVIDIA...")

        response = await self.client.chat.completions.create(
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
            temperature=0,
            max_tokens=1024,
        )

        print("✅ NVIDIA Response Received")

        content = response.choices[0].message.content or ""
        content = content.strip()

        print("\n========== RAW MODEL RESPONSE ==========")
        print(content)
        print("========================================\n")

        # -----------------------------------------
        # Remove Markdown code fences if present
        # -----------------------------------------

        if content.startswith("```"):

            lines = content.splitlines()

            # Remove opening ``` or ```json
            lines = lines[1:]

            # Remove closing ```
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]

            content = "\n".join(lines).strip()

        print("\n========== CLEAN JSON ==========")
        print(content)
        print("================================\n")

        if not content:
            raise ValueError("Model returned an empty response.")

        try:
            return json.loads(content)

        except json.JSONDecodeError as e:

            print("❌ JSON Parsing Failed")
            print(e)

            raise ValueError(
                f"Model did not return valid JSON.\n\nResponse:\n{content}"
            ) from e