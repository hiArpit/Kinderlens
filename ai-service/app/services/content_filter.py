import re
from typing import Tuple, List

# Patterns strictly forbidden under KinderLens Child Safety Guidelines
DISALLOWED_PATTERNS = [
    # Persona & Anthropomorphism (Principle 1)
    r"\b(i am|i'm|i feel|i think|i love|i hate|my favorite|i want)\b",
    r"\b(be my friend|your friend|best friend|tell me a secret)\b",
    
    # Conversational & Open-chat traps (Principle 2)
    r"\b(what is your name|how old are you|where do you live|who are you)\b",
    r"\b(tell me about yourself|talk to me|what do you think)\b",

    # Safety Hazards & Harmful Concepts
    r"\b(knife|gun|weapon|blade|poison|fire|burn|electric socket|cut yourself|dangerous)\b",
    r"\b(kill|dead|die|hurt|blood|hate|swear)\b",
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in DISALLOWED_PATTERNS]

def inspect_safety_completion(texts: List[str]) -> Tuple[bool, List[str]]:
    """
    Scans generated text segments against deterministic safety patterns.
    Returns: (is_safe, list_of_violations)
    """
    violations = []
    
    for text in texts:
        if not text:
            continue
        for pattern in COMPILED_PATTERNS:
            match = pattern.search(text)
            if match:
                violations.append(f"Triggered safety pattern: '{match.group(0)}'")

    is_safe = len(violations) == 0
    return is_safe, violations