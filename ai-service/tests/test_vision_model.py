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
