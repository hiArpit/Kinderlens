import os
import json
import textstat
from google import genai
from google.genai import types
from dotenv import load_dotenv
from app.services.grounding import fetch_grounding_text
from app.services.content_filter import inspect_safety_completion

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

OBJECT_DETECTION_PROMPT = """Analyze this image. Perform two steps:
1. SAFETY CHECK:
   If the image depicts weapons, real blades, violence, adult content, illicit items, or dangerous chemicals, mark "is_safe" as false and give a brief reason in "safety_flag_reason".
2. IDENTIFICATION:
   Identify the primary everyday object, animal, plant, vehicle, or structure. Return a clear, standard English search term (e.g., "Smartphone", "Honeybee", "Apple", "Guitar").
   If blurry, dark, blank, or unrecognizable, set "identified" to false.

Return ONLY a JSON object:
{
  "is_safe": true,
  "safety_flag_reason": null,
  "identified": true,
  "search_term": "Smartphone",
  "confidence_note": null
}
"""

CHILD_GROUNDED_SYNTHESIS_PROMPT = """You are the educational text calibrator for KinderLens, an app for children ages 6 to 8.

You must explain the object "{object_name}" using ONLY the facts present in the verified reference text below. Do NOT introduce external trivia, invented facts, or speculation.

VERIFIED REFERENCE TEXT:
{reference_text}

RULES:
1. AGE CALIBRATION (Ages 6-8):
   - Short sentences (6 to 10 words each).
   - High-frequency, elementary words.
   - Grounded physical analogy that matches the reference text.
2. STRICT SAFETY:
   - Zero persona or roleplay: Never say "I", "me", "my", or "friend".
   - No open conversation or personal questions.
3. OUTPUT FORMAT:
   Return a JSON object:
   {{
     "kid_summary": "2 short, clear sentences explaining what this is and what it does based on the text.",
     "fun_fact": "1 simple, verifiable fact taken directly from the text.",
     "action_prompt": "1 safe physical observation activity (e.g., look for a shape, count buttons, or notice a color)."
   }}

Return ONLY valid JSON.
"""

def evaluate_readability(text: str) -> dict:
    if not text:
        return {"grade_level": 0.0, "reading_ease": 100.0, "age_appropriate": True}
    grade = textstat.flesch_kincaid_grade(text)
    ease = textstat.flesch_reading_ease(text)
    return {
        "grade_level": round(grade, 1),
        "reading_ease": round(ease, 1),
        "age_appropriate": grade <= 4.0
    }

def analyze_image_buffer(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    try:
        # Step A: Identify object and verify initial visual safety
        detection_res = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                OBJECT_DETECTION_PROMPT
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        parsed_det = json.loads(detection_res.text.strip())

        if not parsed_det.get("is_safe", True):
            return {
                "success": True,
                "identified": False,
                "is_safe": False,
                "safety_flag_reason": parsed_det.get("safety_flag_reason", "Object flagged as unsafe for children."),
                "object_name": None,
                "kid_summary": None,
                "fun_fact": None,
                "action_prompt": None,
                "readability": None,
                "grounding": None,
                "confidence_note": None,
                "error": None
            }

        if not parsed_det.get("identified", False) or not parsed_det.get("search_term"):
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
                "grounding": None,
                "confidence_note": parsed_det.get("confidence_note", "Could not clearly identify this item."),
                "error": None
            }

        object_name = parsed_det["search_term"]

        # Step B: Fetch verified external knowledge
        grounding_info = fetch_grounding_text(object_name)
        ref_text = grounding_info["extract"] or f"{object_name} is an everyday physical item."

        # Step C: Synthesize child explanation strictly grounded in reference text
        prompt = CHILD_GROUNDED_SYNTHESIS_PROMPT.format(
            object_name=object_name,
            reference_text=ref_text
        )

        synthesis_res = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        parsed_synth = json.loads(synthesis_res.text.strip())

        kid_summary = parsed_synth.get("kid_summary", "")
        fun_fact = parsed_synth.get("fun_fact", "")
        action_prompt = parsed_synth.get("action_prompt", "")

        # Step D: Independent Post-Generation Content Filter
        texts_to_check = [kid_summary, fun_fact, action_prompt]
        is_safe, violations = inspect_safety_completion(texts_to_check)

        if not is_safe:
            return {
                "success": True,
                "identified": False,
                "is_safe": False,
                "safety_flag_reason": "; ".join(violations),
                "object_name": None,
                "kid_summary": None,
                "fun_fact": None,
                "action_prompt": None,
                "readability": None,
                "grounding": None,
                "confidence_note": "Output blocked by content safety gate.",
                "error": None
            }

        # Step E: Readability assessment
        combined_text = f"{kid_summary} {fun_fact}"
        readability_metrics = evaluate_readability(combined_text)

        return {
            "success": True,
            "identified": True,
            "is_safe": True,
            "safety_flag_reason": None,
            "object_name": object_name,
            "kid_summary": kid_summary,
            "fun_fact": fun_fact,
            "action_prompt": action_prompt,
            "readability": readability_metrics,
            "grounding": {
                "grounded": grounding_info.get("grounded", False),
                "source_title": grounding_info.get("source_title"),
                "source_url": grounding_info.get("source_url")
            },
            "confidence_note": None,
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
            "grounding": None,
            "confidence_note": None,
            "error": str(e)
        }