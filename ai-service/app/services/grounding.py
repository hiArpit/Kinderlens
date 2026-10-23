import wikipediaapi
from typing import Optional, Dict

# User-agent compliant with Wikimedia API policy
wiki_wiki = wikipediaapi.Wikipedia(
    user_agent="KinderLens/1.0 (educational-child-companion; contact: info@kinderlens.local)",
    language="en",
    extract_format=wikipediaapi.ExtractFormat.WIKI
)

def fetch_grounding_text(query: str) -> Dict[str, Optional[str]]:
    """
    Fetches the verified summary extract from Wikipedia for the identified object.
    Falls back gracefully if no direct match is found.
    """
    if not query:
        return {"grounded": False, "source_title": None, "source_url": None, "extract": None}

    # 1. Direct match attempt
    page = wiki_wiki.page(query)
    
    # 2. Case-insensitive / title cleanup fallback if direct match fails
    if not page.exists():
        page = wiki_wiki.page(query.title())

    if not page.exists():
        return {
            "grounded": False,
            "source_title": None,
            "source_url": None,
            "extract": None
        }

    # Fetch top introductory sections (first 1000 characters is ideal for grounding)
    summary_text = (page.summary or page.text or "").strip()[:1200]
    if not summary_text:
        return {
            "grounded": False,
            "source_title": None,
            "source_url": None,
            "extract": None
        }

    return {
        "grounded": True,
        "source_title": page.title,
        "source_url": page.fullurl,
        "extract": summary_text
    }