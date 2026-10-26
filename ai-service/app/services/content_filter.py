import re
from typing import List, Tuple

# Patterns blocked by KinderLens child safety rules.
# Hindi phrases use Unicode escapes so this source stays safe across Windows editors.
DISALLOWED_PATTERNS = [
    # Persona and anthropomorphism
    r"\b(i am|i'm|i feel|i think|i love|i hate|my favorite|i want)\b",
    r"\b(be my friend|your friend|best friend|tell me a secret)\b",
    # Conversational and personal-question traps
    r"\b(what is your name|how old are you|where do you live|who are you)\b",
    r"\b(tell me about yourself|talk to me|what do you think)\b",
    # Safety hazards and harmful concepts
    r"\b(knife|gun|weapon|blade|poison|fire|burn|electric socket|cut yourself|dangerous)\b",
    r"\b(kill|dead|die|hurt|blood|hate|swear)\b",
    # Hindi persona and personal questions
    r"(\u092e\u0948\u0902 \u0924\u0941\u092e\u094d\u0939\u093e\u0930\u093e \u0926\u094b\u0938\u094d\u0924 \u0939\u0942\u0901|\u092e\u0948\u0902 \u0906\u092a\u0915\u093e \u0926\u094b\u0938\u094d\u0924 \u0939\u0942\u0901|\u092e\u0941\u091d\u0947 \u0905\u092a\u0928\u093e \u0928\u093e\u092e \u092c\u0924\u093e\u0913|\u0924\u0941\u092e \u0915\u0939\u093e\u0902 \u0930\u0939\u0924\u0947 \u0939\u094b|\u0924\u0941\u092e\u094d\u0939\u093e\u0930\u0940 \u0909\u092e\u094d\u0930 \u0915\u093f\u0924\u0928\u0940 \u0939\u0948)",
    # Hindi harm terms
    r"(\u091a\u093e\u0915\u0942|\u092c\u0902\u0926\u0942\u0915|\u0939\u0925\u093f\u092f\u093e\u0930|\u091c\u0939\u0930|\u0916\u0942\u0928|\u0939\u0924\u094d\u092f\u093e|\u0916\u0941\u0926 \u0915\u094b \u0915\u093e\u091f\u094b|\u092e\u093e\u0930 \u0921\u093e\u0932\u094b)",
    # Common Hinglish transliterations
    r"\b(main tumhara dost hoon|main aapka dost hoon|mujhe apna naam batao|tum kahan rehte ho|tumhari umar kya hai)\b",
    r"\b(chaku|bandook|hathiyar|zehar|khoon|aag|khud ko kaato|maar daalo)\b",
]

COMPILED_PATTERNS = [re.compile(pattern, re.IGNORECASE) for pattern in DISALLOWED_PATTERNS]


def inspect_safety_completion(texts: List[str]) -> Tuple[bool, List[str]]:
    """Return whether generated text passes the deterministic safety scan."""
    violations = []
    for text in texts:
        if not text:
            continue
        for pattern in COMPILED_PATTERNS:
            match = pattern.search(text)
            if match:
                violations.append(f"Triggered safety pattern: '{match.group(0)}'")
    return not violations, violations
