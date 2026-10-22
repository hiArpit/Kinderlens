import os
import json
import textstat
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

CHILD_CALIBRATION_PROMPT = """You are the vision and education module for KinderLens, an app for children ages 6 to 8 (1st to 3rd grade).

First, perform a safety check:
- If the image contains weapons, real blades, violence, adult content, illicit items, or dangerous household chemicals/hazards, mark "is_safe" as false and set "safety_flag_reason" to a gentle note for parents (e.g. "This object is for adults only or poses safety concerns").

If the image is safe, identify the central object and formulate an explanation following these rules:
1. AGE CALIBRATION (Ages 6-8):
   - Use short sentences (6 to 10 words each).
   - Use simple, familiar words. Avoid technical jargon.
   - Use a physical analogy that a child understands.
2. SAFETY GUARDRAIL - STRICT:
   - DO NOT roleplay or assume a human or character identity.
   - Never say "I", "me", "my", "I love", or "I think".
   - Never ask personal questions or encourage open chatting.
3. OUTPUT FORMAT:
   Return a single JSON object with these exact keys:
   {
     "is_safe": true,
     "safety_flag_reason": null,
     "identified": true,
     "object_name": "Standard object name",
     "kid_summary": "2 short, easy sentences explaining what this is and what it does.",
     "fun_fact": "1 surprising, simple fact about it.",
     "action_prompt": "1 safe observation activity for the child (e.g. 'Can you spot what color it has?' or 'Count how many buttons it has!').",
     "confidence_note": null
   }

If the image is unidentifiable, blurry, or blank:
   {
     "is_safe": true,
     "safety_flag_reason": null,
     "identified": false,
     "object_name": null,
     "kid_summary": null,
     "fun_fact": null,
     "action_prompt": null,
     "confidence_note": "A clear, helpful note explaining why it could not be identified."
   }

Return ONLY valid raw JSON without markdown formatting or code blocks.
"""

def evaluate_readability(text: str) -> dict:
    if not text:
        return {"grade_level": 0.0, "reading_ease": 100.0, "age_appropriate": True}
    
    grade = textstat.flesch_kincaid_grade(text)
    ease = textstat.flesch_reading_ease(text)
    
    # Target reading range for ages 6-8 is grade 1.0 to 3.8
    is_appropriate = grade <= 4.0
    
    return {
        "grade_level": round(grade, 1),
        "reading_ease": round(ease, 1),
        "age_appropriate": is_appropriate
    }

def analyze_image_buffer(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                CHILD_CALIBRATION_PROMPT
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )

        raw_text = response.text.strip()
        parsed = json.loads(raw_text)

        if not parsed.get("is_safe", True):
            return {
                "success": True,
                "identified": False,
                "is_safe": False,
                "safety_flag_reason": parsed.get("safety_flag_reason"),
                "object_name": None,
                "kid_summary": None,
                "fun_fact": None,
                "action_prompt": None,
                "readability": None,
                "confidence_note": None,
                "error": None
            }

        if not parsed.get("identified", False):
            return {
                "success": True,
                "identified": False,
                "is_safe": True,
                "safety_flag_reason": None,
                "object_name": None,
                "kid_summary": None,
                "fun_fact": None,
                "action_prompt": None,
                "readability": None,
                "confidence_note": parsed.get("confidence_note"),
                "error": None
            }

        # Calculate readability metrics over the generated child text
        combined_text = f"{parsed.get('kid_summary', '')} {parsed.get('fun_fact', '')}"
        readability_metrics = evaluate_readability(combined_text)

        return {
            "success": True,
            "identified": True,
            "is_safe": True,
            "safety_flag_reason": None,
            "object_name": parsed.get("object_name"),
            "kid_summary": parsed.get("kid_summary"),
            "fun_fact": parsed.get("fun_fact"),
            "action_prompt": parsed.get("action_prompt"),
            "readability": readability_metrics,
            "confidence_note": parsed.get("confidence_note"),
            "error": None
        }

    except Exception as e:
        return {
            "success": False,
            "identified": False,
            "is_safe": True,
            "safety_flag_reason": None,
            "object_name": None,
            "kid_summary": None,
            "fun_fact": None,
            "action_prompt": None,
            "readability": None,
            "confidence_note": None,
            "error": str(e)
        }