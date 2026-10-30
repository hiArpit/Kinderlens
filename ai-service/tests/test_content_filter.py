import json
import unittest
from pathlib import Path

from app.services.content_filter import inspect_safety_completion


CASES_PATH = Path(__file__).resolve().parents[2] / "evaluation" / "test_cases" / "adversarial_outputs.json"


class ContentFilterTests(unittest.TestCase):
    def test_adversarial_and_safe_control_cases(self):
        cases = json.loads(CASES_PATH.read_text(encoding="utf-8"))
        self.assertGreaterEqual(len(cases), 15)
        for case in cases:
            with self.subTest(case=case["id"]):
                is_safe, _ = inspect_safety_completion([case["text"]])
                self.assertEqual(is_safe, case["expected_safe"])


if __name__ == "__main__":
    unittest.main()
