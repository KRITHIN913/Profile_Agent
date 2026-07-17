import os
import asyncio
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

models_to_test = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-pro"
]

async def test():
    for model in models_to_test:
        print(f"Testing {model}...")
        try:
            response = await client.aio.models.generate_content(
                model=model,
                contents="Hello"
            )
            print(f"Success with {model}!")
        except Exception as e:
            print(f"Failed with {model}: {e}")

if __name__ == "__main__":
    asyncio.run(test())
