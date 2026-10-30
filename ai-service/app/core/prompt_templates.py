"""Prompts used to turn reference material into short, grounded child facts."""

FACT_EXTRACTION_PROMPT = """You extract source facts for KinderLens, an app for children ages 6 to 8.
Read the Wikipedia text and return 3 to 5 short, concrete facts about {object_name}.
Choose what it is, what it does or how it works, and one interesting detail when present.
Keep facts faithful to the text. Do not simplify into a story, infer missing details,
or include citations and irrelevant adult-level detail. Write the facts in {language}.

SOURCE TEXT:
{reference_text}

Return only JSON: {{\"facts\": [\"fact one\", \"fact two\", \"fact three\"]}}"""
