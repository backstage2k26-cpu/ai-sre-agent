import asyncio
import json

from google import genai
from google.genai import types

from app.core.config import settings


class GeminiClient:

    def __init__(self):

        self.client = genai.Client(
            vertexai=True,
            project=settings.gcp_project,
            location=settings.gcp_location,
        )

        print("✅ Vertex AI Gemini initialized")

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str,
    ) -> str:

        prompt = f"""
{system_prompt}

{user_prompt}
"""

        print("\n========== GEMINI REQUEST ==========")
        print(f"Project          : {settings.gcp_project}")
        print(f"Location         : {settings.gcp_location}")
        print(f"Model            : {model}")
        print(f"System Prompt    : {len(system_prompt)} chars")
        print(f"User Prompt      : {len(user_prompt)} chars")
        print(f"Combined Prompt  : {len(prompt)} chars")

        print("\n========== PROMPT PREVIEW ==========")
        print(prompt[:1000])
        print("====================================")

        last_exception = None

        for attempt in range(3):

            try:

                print(f"\n===== Gemini Attempt {attempt + 1}/3 =====")
                print(">>> Before Gemini API")

                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        self.client.models.generate_content,
                        model=model,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=0,
                        ),
                    ),
                    timeout=60,
                )

                print(">>> After Gemini API")

                if response is None:
                    raise RuntimeError("Gemini returned None.")

                print("Response object received")

                if not response.text:
                    print(response)
                    raise RuntimeError("Gemini returned an empty response.")

                print("========== RAW GEMINI RESPONSE ==========")
                print(response.text)
                print("=========================================")

                return response.text

            except asyncio.TimeoutError:

                print("❌ Gemini request timed out after 60 seconds")

                if attempt == 2:
                    raise

            except Exception as ex:

                last_exception = ex

                print(f"❌ Gemini Exception ({type(ex).__name__})")
                print(ex)

                if attempt == 2:
                    raise

            print("Retrying...")
            await asyncio.sleep(2 ** attempt)

        raise last_exception

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

            if lines:
                lines = lines[1:]

            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]

            text = "\n".join(lines).strip()

        print("\n========== RAW JSON TEXT ==========")
        print(text)
        print("===================================")

        try:

            parsed = json.loads(text)

            print("✅ JSON parsed successfully")

            return parsed

        except json.JSONDecodeError as ex:

            print("❌ JSON parsing failed")
            print(ex)

            raise