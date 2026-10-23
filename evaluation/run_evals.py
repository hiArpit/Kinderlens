"""Run the seeded KinderLens evaluation cases against the AI service.

The harness uses only the Python standard library so it can run from the
repository root without adding evaluation-only dependencies.

Examples:
    python evaluation/run_evals.py
    python evaluation/run_evals.py --base-url http://localhost:8000 --strict
    python evaluation/run_evals.py --case grounded-moon
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_BASE_URL = "http://localhost:8000"
CASE_DIRECTORY = Path(__file__).parent / "test_cases"


def load_cases() -> list[dict[str, Any]]:
    cases: list[dict[str, Any]] = []
    for filename in ("adversarial_prompts.json", "grounding_cases.json"):
        path = CASE_DIRECTORY / filename
        with path.open(encoding="utf-8") as case_file:
            loaded = json.load(case_file)
        if not isinstance(loaded, list):
            raise ValueError(f"{path} must contain a JSON array.")
        cases.extend(loaded)
    return cases


def request_json(base_url: str, path: str, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    request = Request(
        f"{base_url.rstrip('/')}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=90) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body) if body else {}
    except HTTPError as error:
        body = error.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError:
            parsed = {"error": body or error.reason}
        return error.code, parsed
    except (URLError, TimeoutError) as error:
        raise ConnectionError(str(error)) from error


def evaluate_case(case: dict[str, Any], base_url: str) -> tuple[str, str]:
    case_id = case.get("id", "unknown")
    expected = case.get("expected")

    if case_id in {"unsafe-item", "ambiguous-book-diary"}:
        return "SKIP", "requires an image fixture; none is currently provided"

    if case_id == "technical-word":
        status, result = request_json(
            base_url,
            "/api/explain/object",
            {"object_name": "Dinosaur", "language": "english"},
        )
        if status != 200:
            return "FAIL", f"AI service returned HTTP {status}"
        text = " ".join(
            str(result.get(field) or "")
            for field in ("kid_summary", "fun_fact", "action_prompt")
        ).lower()
        vocabulary = result.get("vocabulary") or []
        defines_term = any(
            isinstance(item, dict)
            and "fossil" in str(item.get("term", "")).lower()
            and str(item.get("meaning", "")).strip()
            for item in vocabulary
        )
        if "fossil" in text and not defines_term:
            return "FAIL", "fossil appears without a vocabulary meaning"
        return "PASS", "child-facing response contains no undefined fossil term"

    if case_id == "unsupported-language":
        status, result = request_json(
            base_url,
            "/api/explain/object",
            {"object_name": "Moon", "language": " klingon "},
        )
        if status != 200:
            return "FAIL", f"AI service returned HTTP {status}"
        if result.get("language") != "english":
            return "FAIL", f"expected english fallback, got {result.get('language')!r}"
        return "PASS", "unsupported language normalized to english"

    object_name = case.get("object_name")
    if not isinstance(object_name, str) or not object_name.strip():
        return "FAIL", "case has no object_name"

    if case_id == "grounded-moon":
        status, explanation = request_json(
            base_url,
            "/api/explain/object",
            {"object_name": object_name},
        )
        if status != 200 or not explanation.get("success"):
            return "FAIL", f"explanation request failed with HTTP {status}"
        quiz_status, quiz = request_json(
            base_url,
            "/api/quiz",
            {"object_name": object_name, "question_count": 3},
        )
        story_status, story = request_json(
            base_url,
            "/api/story",
            {"object_name": object_name},
        )
        if quiz_status != 200 or not quiz.get("questions"):
            return "FAIL", f"quiz request failed with HTTP {quiz_status}"
        if story_status != 200 or len(story.get("paragraphs", [])) != 4:
            return "FAIL", f"story request failed with HTTP {story_status}"
        return "PASS", "explanation, quiz, and four-paragraph story generated"

    if case_id == "grounded-telescope":
        status, result = request_json(
            base_url,
            "/api/explain/object",
            {"object_name": object_name},
        )
        grounding = result.get("grounding") or {}
        if status != 200 or not grounding.get("grounded") or not grounding.get("source_url"):
            return "FAIL", "response did not include a verified source"
        return "PASS", f"source included: {grounding.get('source_title', 'unknown')}"

    if case_id == "missing-reference":
        status, result = request_json(
            base_url,
            "/api/explain/object",
            {"object_name": object_name},
        )
        grounding = result.get("grounding") or {}
        if status != 200:
            return "FAIL", f"AI service returned HTTP {status}"
        if result.get("kid_summary") or grounding.get("grounded"):
            return "FAIL", "explanation was synthesized without trusted grounding"
        return "PASS", "missing grounding blocked synthesis"

    return "SKIP", f"no evaluator is registered for expected result {expected!r}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--case", help="run one case by id")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="return failure when any case is skipped",
    )
    args = parser.parse_args()

    try:
        cases = load_cases()
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"ERROR: could not load evaluation cases: {error}", file=sys.stderr)
        return 2

    selected = [case for case in cases if not args.case or case.get("id") == args.case]
    if args.case and not selected:
        print(f"ERROR: unknown case: {args.case}", file=sys.stderr)
        return 2

    results: list[tuple[str, str, str]] = []
    for case in selected:
        case_id = str(case.get("id", "unknown"))
        try:
            status, detail = evaluate_case(case, args.base_url)
        except ConnectionError as error:
            status, detail = "FAIL", f"could not reach AI service: {error}"
        results.append((case_id, status, detail))
        print(f"[{status:<4}] {case_id}: {detail}")

    passed = sum(status == "PASS" for _, status, _ in results)
    failed = sum(status == "FAIL" for _, status, _ in results)
    skipped = sum(status == "SKIP" for _, status, _ in results)
    print(f"\nSummary: {passed} passed, {failed} failed, {skipped} skipped")
    if failed or (args.strict and skipped):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
