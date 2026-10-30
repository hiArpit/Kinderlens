import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.core import vision_model


def completion(payload):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=json.dumps(payload)))]
    )


def fact_completion():
    return completion({"facts": [
        "It is an object found in nature.",
        "It has a useful job.",
        "It has one interesting feature.",
    ]})


class VisionModelTests(unittest.TestCase):
    @patch.object(vision_model, "extract_child_facts", return_value=["verified fact one", "verified fact two", "verified fact three"])
    @patch.object(vision_model.client.chat.completions, "create")
    def test_hindi_mixed_script_draft_is_regenerated(self, create, extract_facts):
        mixed = completion({
            "kid_summary": "\u091C\u094D\u0935\u093E\u0932\u093E\u092E\u0941\u0916\u0940 \u092A\u0930\u094D\u0935\u0924 \u0939\u0948\u0964",
            "fun_fact": "\u0907\u0938\u092E\u0947\u0902 vulkan \u0939\u0948\u0964",
            "action_prompt": "\u0930\u0902\u0917 \u0926\u0947\u0916\u094B\u0964",
            "vocabulary": [],
        })
        clean = completion({
            "kid_summary": "\u091C\u094D\u0935\u093E\u0932\u093E\u092E\u0941\u0916\u0940 \u092A\u0930\u094D\u0935\u0924 \u0939\u0948\u0964",
            "fun_fact": "\u0907\u0938\u092E\u0947\u0902 \u0917\u0930\u094D\u092E \u0932\u093E\u0935\u093E \u0939\u0948\u0964",
            "action_prompt": "\u0930\u0902\u0917 \u0926\u0947\u0916\u094B\u0964",
            "vocabulary": [],
        })
        create.side_effect = [mixed, clean]

        result, _ = vision_model.generate_child_explanation("Volcano", "source text", "hindi")

        expected = json.loads(clean.choices[0].message.content)
        self.assertEqual(result["fun_fact"], expected["fun_fact"])
        self.assertEqual(create.call_count, 2)
        self.assertIn("mixed scripts", create.call_args.kwargs["messages"][0]["content"])

    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_named_object_explanation_passes_selected_language(self, create, fetch_grounding):
        hindi_output = {
            "kid_summary": "\u091A\u0902\u0926\u094D\u0930\u092E\u093E \u0918\u0942\u092E\u0924\u093E \u0939\u0948\u0964 \u092F\u0939 \u0930\u093E\u0924 \u092E\u0947\u0902 \u091A\u092E\u0915\u0924\u093E \u0939\u0948\u0964 \u092F\u0939 \u0909\u092A\u0917\u094D\u0930\u0939 \u0939\u0948\u0964",
            "fun_fact": "\u091A\u0902\u0926\u094D\u0930\u092E\u093E \u092A\u0943\u0925\u094D\u0935\u0940 \u0915\u093E \u0909\u092A\u0917\u094D\u0930\u0939 \u0939\u0948\u0964",
            "action_prompt": "\u0906\u091C \u0930\u093E\u0924 \u091A\u0902\u0926\u094D\u0930\u092E\u093E \u0915\u094B \u0926\u0947\u0916\u094B\u0964",
            "vocabulary": [],
        }
        create.side_effect = [fact_completion(), *[completion(hindi_output) for _ in range(3)]]
        fetch_grounding.return_value = {
            "grounded": True,
            "source_title": "Moon",
            "source_url": "https://en.wikipedia.org/wiki/Moon",
            "extract": "The Moon is Earth's natural satellite.",
        }

        result = vision_model.explain_object_name("Moon", "hindi")

        self.assertEqual(result["language"], "hindi")
        self.assertTrue(result["identified"])
        self.assertEqual(create.call_count, 2)
        self.assertIn("Devanagari", create.call_args.kwargs["messages"][0]["content"])

    def test_child_prompts_require_plain_language_definitions(self):
        self.assertIn("explain it immediately in simple words", vision_model.CHILD_GROUNDED_SYNTHESIS_PROMPT)
        self.assertIn("STYLE EXAMPLES", vision_model.CHILD_GROUNDED_SYNTHESIS_PROMPT)
        self.assertIn("never reuse facts or words", vision_model.CHILD_GROUNDED_SYNTHESIS_PROMPT)
        self.assertIn("Explain every science, history, or subject word", vision_model.STORY_PROMPT)
        self.assertIn("fossil fuels", vision_model.STORY_PROMPT)

    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_story_uses_grounding_and_returns_paragraphs(self, create, fetch_grounding):
        create.side_effect = [fact_completion(), completion({
            "title": "The Telescope That Looked Far",
            "paragraphs": [
                "A telescope helps people see far things.",
                "It uses light to show distant objects.",
                "Its glass lenses help bring far views closer.",
                "A careful observer can notice shapes in the sky.",
            ],
            "vocabulary": [
                {"term": "distant objects", "meaning": "Things that are far away."},
            ],
        })]
        fetch_grounding.return_value = {
            "grounded": True,
            "source_title": "Telescope",
            "source_url": "https://en.wikipedia.org/wiki/Telescope",
            "extract": "A telescope is an instrument that helps see distant objects using light.",
        }

        result = vision_model.generate_story("Telescope")

        self.assertTrue(result["success"])
        self.assertTrue(result["is_safe"])
        self.assertEqual(result["language"], "english")
        self.assertEqual(len(result["paragraphs"]), 4)
        self.assertEqual(result["vocabulary"][0]["term"], "distant objects")
        self.assertTrue(result["grounding"]["grounded"])
        self.assertEqual(create.call_count, 2)

    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_review_quiz_uses_multiple_grounded_objects(self, create, fetch_grounding):
        create.side_effect = [fact_completion(), fact_completion(), completion({
            "questions": [
                {"question": "What helps a telescope see far?", "options": ["Light", "Soil", "Water"], "answer": 0, "explanation": "A telescope uses light to help us see far things."},
                {"question": "What does a book have?", "options": ["Pages", "Wings", "Wheels"], "answer": 0, "explanation": "Books have pages."},
                {"question": "Which item shares ideas?", "options": ["A book", "A telescope", "A cloud"], "answer": 0, "explanation": "Books can share ideas with words."},
            ]
        })]
        fetch_grounding.side_effect = [
            {"grounded": True, "source_title": "Telescope", "source_url": "telescope-url", "extract": "A telescope helps see far things."},
            {"grounded": True, "source_title": "Book", "source_url": "book-url", "extract": "A book has pages and words."},
        ]

        result = vision_model.generate_review_quiz(["Telescope", "Book", "Book"])

        self.assertTrue(result["success"])
        self.assertEqual(result["object_names"], ["Telescope", "Book"])
        self.assertEqual(len(result["questions"]), 3)
        self.assertEqual(len(result["grounding_sources"]), 2)
        self.assertEqual(create.call_count, 3)

    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_quiz_uses_grounding_and_validates_questions(self, create, fetch_grounding):
        create.side_effect = [fact_completion(), completion({
            "questions": [
                {"question": "What does a book have?", "options": ["Pages", "Wheels", "Wings"], "answer": 0, "explanation": "Books have pages."},
                {"question": "What can books share?", "options": ["Ideas", "Rain", "Music"], "answer": 0, "explanation": "Books can share ideas."},
                {"question": "What might a book have?", "options": ["Pictures", "Engines", "Roots"], "answer": 0, "explanation": "Some books have pictures."},
            ]
        })]
        fetch_grounding.return_value = {
            "grounded": True,
            "source_title": "Book",
            "source_url": "https://en.wikipedia.org/wiki/Book",
            "extract": "A book is a set of pages with words or pictures.",
        }

        result = vision_model.generate_quiz("Book", 3)

        self.assertTrue(result["success"])
        self.assertEqual(len(result["questions"]), 3)
        self.assertEqual(result["questions"][0]["answer"], 0)
        self.assertTrue(result["grounding"]["grounded"])

    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_quiz_grounding_failure_blocks_generation(self, create, fetch_grounding):
        fetch_grounding.return_value = {
            "grounded": False,
            "source_title": None,
            "source_url": None,
            "extract": None,
        }

        result = vision_model.generate_quiz("Unknown object")

        self.assertTrue(result["success"])
        self.assertEqual(result["questions"], [])
        self.assertFalse(result["grounding"]["grounded"])
        create.assert_not_called()

    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_quiz_passes_selected_language(self, create, fetch_grounding):
        create.side_effect = [fact_completion(), completion({
            "questions": [
                {"question": "किताब में क्या होता है?", "options": ["पन्ने", "पंख", "पहिए"], "answer": 0, "explanation": "किताब में पन्ने होते हैं।"},
                {"question": "किताब क्या साझा कर सकती है?", "options": ["विचार", "बारिश", "धुआँ"], "answer": 0, "explanation": "किताबें विचार साझा कर सकती हैं।"},
                {"question": "किताब में क्या हो सकता है?", "options": ["चित्र", "इंजन", "जड़ें"], "answer": 0, "explanation": "कुछ किताबों में चित्र होते हैं।"},
            ]
        })]
        fetch_grounding.return_value = {
            "grounded": True,
            "source_title": "Book",
            "source_url": "https://en.wikipedia.org/wiki/Book",
            "extract": "A book is a set of pages with words or pictures.",
        }

        result = vision_model.generate_quiz("Book", 3, "hindi")

        self.assertEqual(result["language"], "hindi")
        self.assertIn("Devanagari", create.call_args.kwargs["messages"][0]["content"])

    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_named_object_explanation_uses_grounding(self, create, fetch_grounding):
        output = completion({
            "kid_summary": "The Moon goes around Earth. It shines at night. It is near Earth.",
            "fun_fact": "The Moon is Earth's space neighbor.",
            "action_prompt": "Look for the Moon tonight.",
            "vocabulary": [
                {"term": "neighbor", "meaning": "Something that is nearby."},
            ],
        })
        create.side_effect = [fact_completion(), *[output for _ in range(3)]]
        fetch_grounding.return_value = {
            "grounded": True,
            "source_title": "Moon",
            "source_url": "https://en.wikipedia.org/wiki/Moon",
            "extract": "The Moon is Earth's only natural satellite.",
        }

        result = vision_model.explain_object_name("Moon")

        self.assertTrue(result["success"])
        self.assertTrue(result["identified"])
        self.assertEqual(result["object_name"], "Moon")
        self.assertTrue(result["grounding"]["grounded"])
        self.assertEqual(result["vocabulary"][0]["term"], "neighbor")
        self.assertEqual(create.call_count, 2)

    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_named_object_explanation_blocks_output_above_hard_grade_ceiling(self, create, fetch_grounding):
        difficult_output = completion({
            "kid_summary": "Dinosaurs were warm-blooded reptiles with complex biological adaptations.",
            "fun_fact": "Their evolutionary lineage includes numerous specialized species.",
            "action_prompt": "Compare their body structures.",
        })
        create.side_effect = [fact_completion(), difficult_output, difficult_output, difficult_output]
        fetch_grounding.return_value = {
            "grounded": True,
            "source_title": "Dinosaur",
            "source_url": "https://en.wikipedia.org/wiki/Dinosaur",
            "extract": "Dinosaurs are a diverse group of reptiles.",
        }

        result = vision_model.explain_object_name("Dinosaur")

        self.assertTrue(result["success"])
        self.assertFalse(result["identified"])
        self.assertFalse(result["readability"]["age_appropriate"])
        self.assertIsNone(result["object_name"])
        self.assertIn("too hard to explain simply", result["confidence_note"])
        self.assertEqual(create.call_count, 4)

    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_grounding_failure_blocks_synthesis(self, create, fetch_grounding):
        create.return_value = completion({
            "is_safe": True,
            "identified": True,
            "search_term": "Unknown object",
            "confidence": 0.9,
            "possible_objects": ["Unknown object"],
            "needs_clearer_image": False,
        })
        fetch_grounding.return_value = {
            "grounded": False,
            "source_title": None,
            "source_url": None,
            "extract": None,
        }

        result = vision_model.analyze_image_buffer(b"image-bytes")

        self.assertTrue(result["success"])
        self.assertFalse(result["identified"])
        self.assertFalse(result["grounding"]["grounded"])
        self.assertIn("trusted information", result["confidence_note"])
        self.assertEqual(create.call_count, 1)

    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_grounded_result_is_synthesized_and_returned(self, create, fetch_grounding):
        explanation = completion({
            "kid_summary": "Books have pages. They share ideas.",
            "fun_fact": "Some books have pictures.",
            "action_prompt": "Count the pages.",
        })
        create.side_effect = [
            completion({
                "is_safe": True,
                "identified": True,
                "search_term": "Book",
                "confidence": 0.95,
                "possible_objects": ["Book"],
                "needs_clearer_image": False,
            }),
            fact_completion(),
            *[explanation for _ in range(3)],
        ]
        fetch_grounding.return_value = {
            "grounded": True,
            "source_title": "Book",
            "source_url": "https://en.wikipedia.org/wiki/Book",
            "extract": "A book is a set of pages with words or pictures.",
        }

        result = vision_model.analyze_image_buffer(b"image-bytes")

        self.assertTrue(result["success"])
        self.assertTrue(result["identified"])
        self.assertTrue(result["grounding"]["grounded"])
        self.assertEqual(result["object_name"], "Book")
        self.assertEqual(create.call_count, 5)

    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_ambiguous_result_blocks_grounding_and_synthesis(self, create, fetch_grounding):
        create.return_value = completion({
            "is_safe": True,
            "identified": True,
            "search_term": "Book",
            "confidence": 0.62,
            "possible_objects": ["Book", "Diary"],
            "needs_clearer_image": True,
            "confidence_note": "This could be a book or diary.",
        })

        result = vision_model.analyze_image_buffer(b"image-bytes")

        self.assertTrue(result["success"])
        self.assertFalse(result["identified"])
        self.assertTrue(result["needs_clearer_image"])
        self.assertEqual(result["possible_objects"], ["Book", "Diary"])
        self.assertEqual(create.call_count, 1)
        fetch_grounding.assert_not_called()


if __name__ == "__main__":
    unittest.main()
