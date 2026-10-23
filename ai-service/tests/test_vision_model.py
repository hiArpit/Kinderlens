import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.core import vision_model


def completion(payload):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=json.dumps(payload)))]
    )


class VisionModelTests(unittest.TestCase):
    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_story_uses_grounding_and_returns_paragraphs(self, create, fetch_grounding):
        create.return_value = completion({
            "title": "The Telescope That Looked Far",
            "paragraphs": [
                "A telescope helps people see far things.",
                "It uses light to show distant objects.",
                "Its glass lenses help bring far views closer.",
                "A careful observer can notice shapes in the sky.",
            ],
        })
        fetch_grounding.return_value = {
            "grounded": True,
            "source_title": "Telescope",
            "source_url": "https://en.wikipedia.org/wiki/Telescope",
            "extract": "A telescope is an instrument that helps see distant objects using light.",
        }

        result = vision_model.generate_story("Telescope")

        self.assertTrue(result["success"])
        self.assertTrue(result["is_safe"])
        self.assertEqual(len(result["paragraphs"]), 4)
        self.assertTrue(result["grounding"]["grounded"])

    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_review_quiz_uses_multiple_grounded_objects(self, create, fetch_grounding):
        create.return_value = completion({
            "questions": [
                {"question": "What helps a telescope see far?", "options": ["Light", "Soil", "Water"], "answer": 0, "explanation": "A telescope uses light to help us see far things."},
                {"question": "What does a book have?", "options": ["Pages", "Wings", "Wheels"], "answer": 0, "explanation": "Books have pages."},
                {"question": "Which item shares ideas?", "options": ["A book", "A telescope", "A cloud"], "answer": 0, "explanation": "Books can share ideas with words."},
            ]
        })
        fetch_grounding.side_effect = [
            {"grounded": True, "source_title": "Telescope", "source_url": "telescope-url", "extract": "A telescope helps see far things."},
            {"grounded": True, "source_title": "Book", "source_url": "book-url", "extract": "A book has pages and words."},
        ]

        result = vision_model.generate_review_quiz(["Telescope", "Book", "Book"])

        self.assertTrue(result["success"])
        self.assertEqual(result["object_names"], ["Telescope", "Book"])
        self.assertEqual(len(result["questions"]), 3)
        self.assertEqual(len(result["grounding_sources"]), 2)
        self.assertEqual(create.call_count, 1)

    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_quiz_uses_grounding_and_validates_questions(self, create, fetch_grounding):
        create.return_value = completion({
            "questions": [
                {"question": "What does a book have?", "options": ["Pages", "Wheels", "Wings"], "answer": 0, "explanation": "Books have pages."},
                {"question": "What can books share?", "options": ["Ideas", "Rain", "Music"], "answer": 0, "explanation": "Books can share ideas."},
                {"question": "What might a book have?", "options": ["Pictures", "Engines", "Roots"], "answer": 0, "explanation": "Some books have pictures."},
            ]
        })
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
    def test_named_object_explanation_uses_grounding(self, create, fetch_grounding):
        create.return_value = completion({
            "kid_summary": "The Moon goes around Earth. It shines in the night sky.",
            "fun_fact": "The Moon is Earth's space neighbor.",
            "action_prompt": "Look for the Moon tonight.",
        })
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

    @patch.object(vision_model, "fetch_grounding_text")
    @patch.object(vision_model.client.chat.completions, "create")
    def test_named_object_explanation_keeps_overage_readability_visible(self, create, fetch_grounding):
        create.return_value = completion({
            "kid_summary": "Dinosaurs were warm-blooded reptiles with complex biological adaptations.",
            "fun_fact": "Their evolutionary lineage includes numerous specialized species.",
            "action_prompt": "Compare their body structures.",
        })
        fetch_grounding.return_value = {
            "grounded": True,
            "source_title": "Dinosaur",
            "source_url": "https://en.wikipedia.org/wiki/Dinosaur",
            "extract": "Dinosaurs are a diverse group of reptiles.",
        }

        result = vision_model.explain_object_name("Dinosaur")

        self.assertTrue(result["success"])
        self.assertTrue(result["identified"])
        self.assertFalse(result["readability"]["age_appropriate"])
        self.assertEqual(result["object_name"], "Dinosaur")
        self.assertEqual(create.call_count, 1)

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
        create.side_effect = [
            completion({
                "is_safe": True,
                "identified": True,
                "search_term": "Book",
                "confidence": 0.95,
                "possible_objects": ["Book"],
                "needs_clearer_image": False,
            }),
            completion({
                "kid_summary": "Books have pages. They share ideas.",
                "fun_fact": "Some books have pictures.",
                "action_prompt": "Count the pages.",
            }),
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
        self.assertEqual(create.call_count, 2)

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
