import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Initialize the Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

PROMPT = """You are the vision recognition module for an educational tool for children.
Analyze the provided image and return ONLY a valid JSON object with the following keys:
- "identified": boolean (true if an everyday object, animal, plant, vehicle, or item is clearly visible; false if the photo is too blurry, dark, blank, or unrecognizable)
- "object_name": string or null (concise standard name of the primary object, e.g. "Honeybee", "Acoustic Guitar", "Teapot")
- "raw_description": string or null (2-3 factual sentences describing what the object is and its primary characteristics. Do not use baby talk or roleplay yet.)
- "confidence_note": string or null (brief explanation if the image was difficult to discern or not identified)

Do not wrap the output in markdown codeblocks. Return pure JSON only.
"""

def analyze_image_buffer(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                PROMPT
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )

        parsed = json.loads(response.text.strip())
        return {
            "success": True,
            "identified": parsed.get("identified", False),
            "object_name": parsed.get("object_name"),
            "raw_description": parsed.get("raw_description"),
            "confidence_note": parsed.get("confidence_note"),
            "error": None
        }

    except Exception as e:
        return {
            "success": False,
            "identified": False,
            "object_name": None,
            "raw_description": None,
            "confidence_note": None,
            "error": str(e)
        }