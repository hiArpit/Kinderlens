import re
from typing import Tuple, List

# Block clear roleplay, personal-chat prompts, and direct harmful instructions.
# Avoid blocking ordinary educational mentions of objects such as fire or knives.
DISALLOWED_PATTERNS = [
    r"\b(i am|i'm|i feel|i think|i love|i hate|my favorite|i want)\b",
    r"\b(be my friend|your friend|best friend|tell me a secret)\b",
    r"\b(what is your name|how old are you|where do you live|who are you)\b",
    r"\b(tell me about yourself|talk to me|what do you think)\b",
    r"\b(cut yourself|kill yourself|hurt yourself|how to make a weapon|how to make poison)\b",
    r"\b(kill|murder|suicide|self-harm|graphic gore)\b",
]

COMPILED_PATTERNS = [re.compile(pattern, re.IGNORECASE) for pattern in DISALLOWED_PATTERNS]


def inspect_safety_completion(texts: List[str]) -> Tuple[bool, List[str]]:
    """Scan generated segments for clear safety-policy violations."""
    violations = []
    for text in texts:
        if not isinstance(text, str) or not text:
            continue
        for pattern in COMPILED_PATTERNS:
            match = pattern.search(text)
            if match:
                violations.append(f"Triggered safety pattern: '{match.group(0)}'")
    return len(violations) == 0, violations
