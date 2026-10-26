import unittest

from app.core.age_examples import EXPLANATION_STYLE_EXAMPLES, select_explanation_examples


class AgeExampleTests(unittest.TestCase):
    def test_curated_bank_has_at_least_fifty_examples(self):
        self.assertGreaterEqual(len(EXPLANATION_STYLE_EXAMPLES), 50)

    def test_prompt_selection_is_small_stable_and_object_specific(self):
        first = select_explanation_examples("Moon")
        self.assertEqual(first, select_explanation_examples("Moon"))
        self.assertEqual(first.count("VERIFIED FACTS:"), 3)
        self.assertNotEqual(first, select_explanation_examples("Telescope"))


if __name__ == "__main__":
    unittest.main()
