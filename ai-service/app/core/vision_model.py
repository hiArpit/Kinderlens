import os
import json
import base64
import logging
import textstat
from groq import Groq
from dotenv import load_dotenv
from app.services.grounding import fetch_grounding_text
from app.services.content_filter import inspect_safety_completion

load_dotenv()

logger = logging.getLogger(__name__)
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Use a current production vision model. The former Llama 3.2 preview model
# is no longer available through Groq.
VISION_MODEL = "qwen/qwen3.8-27b"
MAX_CHILD_GRADE_LEVEL = 4.0

OBJECT_DETECTION_PROMPT = """Analyze this image. Perform two steps:
1. SAFETY CHECK:
   If the image depicts weapons, real blades, violence, adult content, illicit items, or dangerous chemicals, mark "is_safe" as false and give a brief reason in "safety_flag_reason".

2. IDENTIFICATION:
   Identify the primary everyday item, toy, book, tool, food, animal, plant, vehicle, or structure.
   If a person or hand is holding an item, focus on the item being held (e.g., "Book", "Toy", "Apple", "Smartphone", "Eyeglasses").
   Do NOT identify the person. If only a person/face is visible with no clear everyday item, or if the image is blank or completely blurry, set "identified" to false.
   Estimate confidence from 0.0 to 1.0. If two or more objects are plausible,
   list them in "possible_objects" and set "needs_clearer_image" to true.
   Set "needs_clearer_image" to true when the image is too unclear to distinguish
   similar objects, even if one label seems slightly more likely.

Return ONLY a JSON object:
{
  "is_safe": true,
  "safety_flag_reason": null,
  "identified": true,
  "search_term": "Book",
  "confidence": 0.95,
  "possible_objects": ["Book"],
  "needs_clearer_image": false,
  "confidence_note": null
}
"""

CHILD_GROUNDED_SYNTHESIS_PROMPT = """You are the educational text calibrator for KinderLens, an app for children ages 6 to 8.

You must explain the object "{object_name}" using ONLY the facts present in the verified reference text below. Do NOT introduce external trivia, invented facts, or speculation.

VERIFIED REFERENCE TEXT:
{reference_text}

RULES:
1. AGE CALIBRATION (Ages 6-8):
   - Give 3 clear sentences for the summary, not just a label.
   - Use common elementary words and short sentences.
   - You may use 10 to 16 words when needed to explain an idea clearly.
   - If a science or history word is needed, explain it immediately in simple words.
     Example: "A fossil is an old mark or piece of a living thing found in rock."
   - Never use a difficult word by itself when a simpler word will work.
   - Do not mention unrelated technical terms, such as fossil fuels, unless the
     reference text directly explains them and the child-friendly meaning is included.
   - Add a grounded physical analogy only when it matches the reference text.
2. STRICT SAFETY:
   - Zero persona or roleplay: Never say "I", "me", "my", or "friend".
   - No open conversation or personal questions.
3. OUTPUT FORMAT:
   Return a JSON object:
   {{
     "kid_summary": "3 short, clear sentences explaining what this is, what it does, and one useful detail based on the text.",
     "fun_fact": "1 or 2 simple, verifiable sentences taken directly from the text.",
     "action_prompt": "1 safe physical observation activity (e.g., look for a shape, count buttons, or notice a color).",
     "vocabulary": [{{"term": "hard word or phrase", "meaning": "a very simple meaning for a child"}}]
   }}

Return up to 5 vocabulary terms only when they are needed. Use exact words from
the summary or fun fact. Do not include common words. Meanings must be one short,
simple sentence and must use only the verified reference text.

Return ONLY valid JSON.
"""

QUIZ_PROMPT = """Create a quiz for children ages 6 to 8 about "{object_name}".
Use ONLY facts stated in the verified reference text below.
Create exactly {question_count} multiple-choice questions. Each question must have exactly 3
answer options, and "answer" must be the zero-based index of the correct option.
Use simple words. Do not use trick questions, unsafe topics, or facts not in the text.

VERIFIED REFERENCE TEXT:
{reference_text}

Return ONLY valid JSON in this shape:
{{
  "questions": [
    {{"question": "...", "options": ["...", "...", "..."], "answer": 0, "explanation": "A short reason based on the reference text."}}
  ]
}}
"""

REVIEW_QUIZ_PROMPT = """Create a review quiz for children ages 6 to 8.
Use ONLY facts stated in the verified reference sections below.
Create exactly {question_count} multiple-choice questions. Each question must have exactly 3
answer options, and "answer" must be the zero-based index of the correct option.
Use simple words. Include questions about more than one object when possible.
Do not use facts not in the reference sections.

VERIFIED REFERENCE SECTIONS:
{reference_text}

Return ONLY valid JSON:
{{"questions": [{{"question": "...", "options": ["...", "...", "..."], "answer": 0, "explanation": "A short reason based on the reference text."}}]}}
"""

STORY_PROMPT = """Create a short learning story for children ages 6 to 8 about "{object_name}".
Use ONLY facts stated in the verified reference text below. The story may use gentle
imaginary framing, but it must not invent factual claims about the object.
Write exactly 4 short paragraphs. Use simple words and keep each paragraph to 2 or 3 short sentences.
Explain every science, history, or subject word the first time it appears.
For example, write "A fossil is an old mark or piece of life found in rock."
Do not use a difficult word alone when a simple word will work.
Do not mention unrelated technical ideas, such as fossil fuels, unless the reference
text directly explains them and the child-friendly meaning is included.
Do not use scary, unsafe, violent, or roleplay language. Do not ask the child questions.

VERIFIED REFERENCE TEXT:
{reference_text}

Return ONLY valid JSON:
{{"title": "A short story title", "paragraphs": ["...", "...", "...", "..."], "vocabulary": [{{"term": "hard word or phrase", "meaning": "a very simple meaning for a child"}}]}}

Return up to 5 vocabulary terms only when they are needed. Each term must appear
in the story. Meanings must be one short, simple sentence based only on the
verified reference text.
"""


def evaluate_readability(text: str) -> dict:
    if not text:
        return {"grade_level": 0.0, "reading_ease": 100.0, "age_appropriate": True}
    grade = textstat.flesch_kincaid_grade(text)
    ease = textstat.flesch_reading_ease(text)
    return {
        "grade_level": round(grade, 1),
        "reading_ease": round(ease, 1),
        "age_appropriate": grade <= MAX_CHILD_GRADE_LEVEL
    }


ALLOWED_QUESTION_COUNTS = {3, 5, 10}
SUPPORTED_LANGUAGES = {"english", "hindi", "hinglish"}


def language_instruction(language):
    if language == "hindi":
        return "Write the child-facing content in simple Hindi using Devanagari script."
    if language == "hinglish":
        return "Write the child-facing content in natural, simple Hinglish using English letters."
    return "Write the child-facing content in simple English."


def normalize_language(language):
    return language if language in SUPPORTED_LANGUAGES else "english"


def normalize_vocabulary(value, source_texts):
    if not isinstance(value, list):
        return []
    combined_text = " ".join(source_texts).lower()
    terms = []
    for entry in value[:5]:
        if not isinstance(entry, dict):
            continue
        term = entry.get("term")
        meaning = entry.get("meaning")
        if (
            isinstance(term, str)
            and isinstance(meaning, str)
            and term.strip()
            and meaning.strip()
            and term.strip().lower() in combined_text
        ):
            terms.append({"term": term.strip(), "meaning": meaning.strip()})
    return terms


def generate_story(object_name: str, language: str = "english") -> dict:
    try:
        language = normalize_language(language)
        grounding_info = fetch_grounding_text(object_name)
        if not grounding_info.get("grounded") or not grounding_info.get("extract"):
            return {
                "success": True, "object_name": None, "title": None, "paragraphs": [],
                "grounding": {"grounded": False, "source_title": None, "source_url": None},
                "is_safe": True,
                "confidence_note": "I could not find enough trusted information to make a story yet.",
                "error": None,
            }

        completion_result = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[{"role": "user", "content": STORY_PROMPT.format(
                object_name=object_name,
                reference_text=grounding_info["extract"],
            ) + f"\n\nLANGUAGE:\n{language_instruction(language)}"}],
            response_format={"type": "json_object"},
            max_tokens=500,
            temperature=0.3,
        )
        parsed = json.loads(completion_result.choices[0].message.content.strip())
        title = parsed.get("title")
        paragraphs = parsed.get("paragraphs")
        if (
            not isinstance(title, str) or not title.strip()
            or not isinstance(paragraphs, list) or len(paragraphs) != 4
            or not all(isinstance(paragraph, str) and paragraph.strip() for paragraph in paragraphs)
        ):
            raise ValueError("Story response must contain a title and exactly four paragraphs.")

        title = title.strip()
        paragraphs = [paragraph.strip() for paragraph in paragraphs]
        vocabulary = normalize_vocabulary(parsed.get("vocabulary"), [title, *paragraphs])
        is_safe, violations = inspect_safety_completion(
            [title, *paragraphs, *[item["meaning"] for item in vocabulary]]
        )
        if not is_safe:
            return {
                "success": True, "object_name": None, "title": None, "paragraphs": [], "vocabulary": [],
                "grounding": None, "is_safe": False,
                "confidence_note": "Story content was blocked by the safety gate.",
                "error": "; ".join(violations),
            }

        return {
            "success": True,
            "object_name": object_name,
            "title": title,
            "paragraphs": paragraphs,
            "vocabulary": vocabulary,
            "grounding": {
                "grounded": True,
                "source_title": grounding_info.get("source_title"),
                "source_url": grounding_info.get("source_url"),
            },
            "is_safe": True,
            "confidence_note": None,
            "error": None,
        }
    except Exception as error:
        logger.exception("Story generation failed")
        return {
            "success": False, "object_name": None, "title": None, "paragraphs": [], "vocabulary": [],
            "grounding": None, "is_safe": True, "confidence_note": None,
            "error": str(error), "language": language,
        }


def generate_quiz(object_name: str, question_count: int = 3) -> dict:
    try:
        if question_count not in ALLOWED_QUESTION_COUNTS:
            raise ValueError("Question count must be 3, 5, or 10.")
        grounding_info = fetch_grounding_text(object_name)
        if not grounding_info.get("grounded") or not grounding_info.get("extract"):
            return {
                "success": True,
                "object_name": None,
                "object_names": [],
                "questions": [],
                "grounding": {"grounded": False, "source_title": None, "source_url": None},
                "is_safe": True,
                "confidence_note": "I could not find enough trusted information to make a quiz yet.",
                "error": None,
            }

        prompt = QUIZ_PROMPT.format(
            object_name=object_name,
            reference_text=grounding_info["extract"],
            question_count=question_count,
        )
        completion_result = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=600,
            temperature=0.1
        )
        parsed = json.loads(completion_result.choices[0].message.content.strip())
        questions = parsed.get("questions")
        if not isinstance(questions, list) or len(questions) != question_count:
            raise ValueError(f"Quiz response must contain exactly {question_count} questions.")

        normalized_questions = []
        text_to_check = []
        for question in questions:
            if not isinstance(question, dict):
                raise ValueError("Quiz question has an invalid shape.")
            prompt_text = question.get("question")
            options = question.get("options")
            answer = question.get("answer")
            explanation = question.get("explanation")
            if (
                not isinstance(prompt_text, str)
                or not prompt_text.strip()
                or not isinstance(options, list)
                or len(options) != 3
                or not all(isinstance(option, str) and option.strip() for option in options)
                or not isinstance(answer, int)
                or answer < 0
                or answer >= len(options)
                or not isinstance(explanation, str)
                or not explanation.strip()
            ):
                raise ValueError("Quiz question failed validation.")
            normalized_questions.append({
                "question": prompt_text.strip(),
                "options": [option.strip() for option in options],
                "answer": answer,
                "explanation": explanation.strip(),
            })
            text_to_check.extend([prompt_text, *options, explanation])

        is_safe, violations = inspect_safety_completion(text_to_check)
        if not is_safe:
            return {
                "success": True,
                "object_name": None,
                "questions": [],
                "grounding": None,
                "is_safe": False,
                "confidence_note": "Quiz content was blocked by the safety gate.",
                "error": "; ".join(violations),
            }

        return {
            "success": True,
            "object_name": object_name,
            "object_names": [object_name],
            "questions": normalized_questions,
            "grounding": {
                "grounded": True,
                "source_title": grounding_info.get("source_title"),
                "source_url": grounding_info.get("source_url"),
            },
            "is_safe": True,
            "confidence_note": None,
            "error": None,
        }
    except Exception as error:
        logger.exception("Quiz generation failed")
        return {
            "success": False,
            "object_name": None,
            "object_names": [],
            "questions": [],
            "grounding": None,
            "is_safe": True,
            "confidence_note": None,
            "error": str(error),
        }


def generate_review_quiz(object_names: list[str], question_count: int = 3) -> dict:
    try:
        if question_count not in ALLOWED_QUESTION_COUNTS:
            raise ValueError("Question count must be 3, 5, or 10.")
        unique_names = list(dict.fromkeys(name.strip() for name in object_names if isinstance(name, str) and name.strip()))
        if not unique_names:
            return {
                "success": True, "object_names": [], "questions": [],
                "grounding_sources": [], "is_safe": True,
                "confidence_note": "Explore an item first to start a review quiz.", "error": None,
            }

        references = []
        grounding_sources = []
        for name in unique_names:
            grounding_info = fetch_grounding_text(name)
            if not grounding_info.get("grounded") or not grounding_info.get("extract"):
                return {
                    "success": True, "object_names": [], "questions": [],
                    "grounding_sources": [], "is_safe": True,
                    "confidence_note": "A trusted review quiz is not available yet.", "error": None,
                }
            references.append(f"ABOUT {name}:\n{grounding_info['extract']}")
            grounding_sources.append({
                "grounded": True,
                "source_title": grounding_info.get("source_title"),
                "source_url": grounding_info.get("source_url"),
            })

        completion_result = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[{"role": "user", "content": REVIEW_QUIZ_PROMPT.format(
                reference_text="\n\n".join(references),
                question_count=question_count,
            )}],
            response_format={"type": "json_object"},
            max_tokens=600,
            temperature=0.1,
        )
        parsed = json.loads(completion_result.choices[0].message.content.strip())
        questions = parsed.get("questions")
        if not isinstance(questions, list) or len(questions) != question_count:
            raise ValueError(f"Review quiz response must contain exactly {question_count} questions.")

        normalized = []
        text_to_check = []
        for question in questions:
            prompt_text = question.get("question") if isinstance(question, dict) else None
            options = question.get("options") if isinstance(question, dict) else None
            answer = question.get("answer") if isinstance(question, dict) else None
            explanation = question.get("explanation") if isinstance(question, dict) else None
            if (
                not isinstance(prompt_text, str) or not prompt_text.strip()
                or not isinstance(options, list) or len(options) != 3
                or not all(isinstance(option, str) and option.strip() for option in options)
                or not isinstance(answer, int) or answer < 0 or answer >= len(options)
                or not isinstance(explanation, str) or not explanation.strip()
            ):
                raise ValueError("Review quiz question failed validation.")
            normalized.append({
                "question": prompt_text.strip(),
                "options": [option.strip() for option in options],
                "answer": answer,
                "explanation": explanation.strip(),
            })
            text_to_check.extend([prompt_text, *options, explanation])

        is_safe, violations = inspect_safety_completion(text_to_check)
        if not is_safe:
            return {
                "success": True, "object_names": [], "questions": [],
                "grounding_sources": [], "is_safe": False,
                "confidence_note": "Review quiz content was blocked by the safety gate.",
                "error": "; ".join(violations),
            }

        return {
            "success": True, "object_names": unique_names, "questions": normalized,
            "grounding_sources": grounding_sources, "is_safe": True,
            "confidence_note": None, "error": None,
        }
    except Exception as error:
        logger.exception("Review quiz generation failed")
        return {
            "success": False, "object_names": [], "questions": [],
            "grounding_sources": [], "is_safe": True,
            "confidence_note": None, "error": str(error),
        }


def explain_object_name(object_name: str, language: str = "english") -> dict:
    try:
        language = normalize_language(language)
        grounding_info = fetch_grounding_text(object_name)
        if not grounding_info.get("grounded") or not grounding_info.get("extract"):
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
                "grounding": {"grounded": False, "source_title": None, "source_url": None},
                "confidence_note": "I could not find enough trusted information about this item yet.",
                "error": None,
            }

        prompt = CHILD_GROUNDED_SYNTHESIS_PROMPT.format(
            object_name=object_name,
            reference_text=grounding_info["extract"]
        ) + f"\n\nLANGUAGE:\n{language_instruction(language)}"
        synthesis_completion = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=300,
            temperature=0.2
        )
        parsed_synth = json.loads(synthesis_completion.choices[0].message.content.strip())
        kid_summary = parsed_synth.get("kid_summary", "")
        fun_fact = parsed_synth.get("fun_fact", "")
        action_prompt = parsed_synth.get("action_prompt", "")
        vocabulary = normalize_vocabulary(
            parsed_synth.get("vocabulary"),
            [kid_summary, fun_fact]
        )
        is_safe, violations = inspect_safety_completion(
            [kid_summary, fun_fact, action_prompt, *[item["meaning"] for item in vocabulary]]
        )

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
                "error": None,
                "language": language,
            }

        readability = evaluate_readability(f"{kid_summary} {fun_fact}")

        return {
            "success": True,
            "identified": True,
            "is_safe": True,
            "safety_flag_reason": None,
            "object_name": object_name,
            "kid_summary": kid_summary,
            "fun_fact": fun_fact,
            "action_prompt": action_prompt,
            "vocabulary": vocabulary,
            "readability": readability,
            "grounding": {
                "grounded": True,
                "source_title": grounding_info.get("source_title"),
                "source_url": grounding_info.get("source_url"),
            },
            "confidence_note": None,
            "error": None,
            "language": language,
        }
    except Exception as error:
        logger.exception("Named object explanation failed")
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
            "error": str(error), "language": language,
        }


def analyze_image_buffer(image_bytes: bytes, mime_type: str = "image/jpeg", language: str = "english") -> dict:
    try:
        language = normalize_language(language)
        # Step A: Base64 encode image for Groq Vision
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        image_data_url = f"data:{mime_type};base64,{base64_image}"

        # Step B: Identify object via Vision model
        detection_completion = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": OBJECT_DETECTION_PROMPT},
                        {"type": "image_url", "image_url": {"url": image_data_url}}
                    ]
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=300,
            temperature=0.1
        )
        parsed_det = json.loads(detection_completion.choices[0].message.content.strip())
        confidence = parsed_det.get("confidence")
        possible_objects = parsed_det.get("possible_objects") or []
        if not isinstance(possible_objects, list):
            possible_objects = []
        possible_objects = [str(item).strip() for item in possible_objects if str(item).strip()]
        needs_clearer_image = bool(parsed_det.get("needs_clearer_image"))

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
                "possible_objects": possible_objects,
                "needs_clearer_image": False,
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
                "possible_objects": possible_objects,
                "needs_clearer_image": True,
                "error": None
            }

        if (
            not isinstance(confidence, (int, float))
            or confidence < 0.75
            or needs_clearer_image
            or len(possible_objects) > 1
        ):
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
                "confidence_note": (
                    parsed_det.get("confidence_note")
                    or "This looks like more than one possible item. Please take a clearer photo."
                ),
                "possible_objects": possible_objects,
                "needs_clearer_image": True,
                "error": None
            }

        object_name = parsed_det["search_term"]

        # Step C: Fetch verified Wikipedia reference text
        try:
            grounding_info = fetch_grounding_text(object_name)
        except Exception:
            logger.exception("Grounding lookup failed for object %r", object_name)
            grounding_info = {
                "grounded": False,
                "source_title": None,
                "source_url": None,
                "extract": None,
            }

        if not grounding_info.get("grounded") or not grounding_info.get("extract"):
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
                "grounding": {
                    "grounded": False,
                    "source_title": None,
                    "source_url": None
                },
                "confidence_note": "I could not find enough trusted information about this item yet.",
                "possible_objects": possible_objects,
                "needs_clearer_image": False,
                "error": None
            }

        ref_text = grounding_info["extract"]

        # Step D: Synthesize grounded explanation with fast text model
        prompt = CHILD_GROUNDED_SYNTHESIS_PROMPT.format(
            object_name=object_name,
            reference_text=ref_text
        ) + f"\n\nLANGUAGE:\n{language_instruction(language)}"

        synthesis_completion = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=300,
            temperature=0.2
        )
        parsed_synth = json.loads(synthesis_completion.choices[0].message.content.strip())

        kid_summary = parsed_synth.get("kid_summary", "")
        fun_fact = parsed_synth.get("fun_fact", "")
        action_prompt = parsed_synth.get("action_prompt", "")
        vocabulary = normalize_vocabulary(
            parsed_synth.get("vocabulary"),
            [kid_summary, fun_fact]
        )

        # Step E: Post-generation content filter check
        texts_to_check = [
            kid_summary,
            fun_fact,
            action_prompt,
            *[item["meaning"] for item in vocabulary],
        ]
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
                ,"language": language
            }

        # Step F: Readability assessment
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
            "vocabulary": vocabulary,
            "readability": readability_metrics,
            "grounding": {
                "grounded": grounding_info.get("grounded", False),
                "source_title": grounding_info.get("source_title"),
                "source_url": grounding_info.get("source_url")
            },
            "confidence_note": None,
            "possible_objects": possible_objects,
            "needs_clearer_image": False,
            "error": None
        }

    except Exception as e:
        logger.exception("Vision analysis failed")
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
            "possible_objects": [],
            "needs_clearer_image": False,
            "error": str(e), "language": language
        }