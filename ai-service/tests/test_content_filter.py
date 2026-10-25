import unittest

from app.services.content_filter import inspect_safety_completion


class ContentFilterTests(unittest.TestCase):
    def test_blocks_persona_and_open_chat_language(self):
        for text in ["I am your friend.", "Tell me a secret.", "Where do you live?"]:
            with self.subTest(text=text):
                self.assertFalse(inspect_safety_completion([text])[0])

    def test_blocks_direct_harmful_language(self):
        for text in ["Please cut yourself.", "How to make a weapon", "kill"]:
            with self.subTest(text=text):
                self.assertFalse(inspect_safety_completion([text])[0])

    def test_allows_benign_educational_mentions(self):
        for text in [
            "Fire gives off heat and light.",
            "A knife is a tool used to cut food by adults.",
            "Blood carries oxygen around the body.",
            "Some animals die when they get very old.",
            "A volcano can burn hot lava onto the ground.",
        ]:
            with self.subTest(text=text):
                self.assertTrue(inspect_safety_completion([text])[0])


if __name__ == "__main__":
    unittest.main()
