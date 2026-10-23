# KinderLens Roadmap

## Completed prototype capabilities

- Photo capture and image upload
- Vision object recognition with ambiguity handling
- Wikipedia-grounded explanations
- Safety filtering
- English, Hindi, and Hinglish summaries and stories
- Tappable child-friendly vocabulary meanings
- Curated Wonder List
- Object-specific and cross-discovery quizzes
- Quiz answer explanations
- Grounded learning stories
- MongoDB interaction history
- PIN-protected Parent Dashboard

## Phase 4 release gate

Before merging `develop` into `main`, manually verify:

1. A clear photo produces a grounded explanation.
2. An ambiguous photo requests a clearer image.
3. An unsafe item is blocked safely.
4. A grounding failure does not produce an explanation.
5. Wonder List items work in English, Hindi, and Hinglish.
6. Vocabulary terms open child-friendly meanings.
7. Quick quizzes support 3, 5, and 10 questions.
8. Review quizzes use previously identified objects.
9. Quiz feedback shows the question, selected answer, correct answer, and reason.
10. Stories show four grounded paragraphs and a source.
11. Quiz and story activity appears in the Parent Dashboard.
12. Locking the Parent Dashboard prevents history access.

## After the first prototype release

- Localize quiz questions and explanations.
- Replace the shared prototype PIN with parent accounts.
- Add child profiles and ownership boundaries.
- Add rate limiting, secure deployment, and stronger session controls.
- Add deletion/export controls and privacy review.
- Expand automated end-to-end and adversarial evaluation coverage.

## Evaluation harness

Run the seeded AI-service evaluations with:

```bash
python evaluation/run_evals.py
```

Use `--strict` to treat any skipped case as a failure. The adversarial image
cases use the checked-in fixtures under `evaluation/test_cases/fixtures`.

## Backend smoke tests

Run the dependency-light backend route checks with:

```bash
cd backend
npm test
```

These checks cover health, capture validation, quiz/story request validation,
parent authorization, and signed parent-token handling without requiring a
running AI service or MongoDB instance.

## Privacy controls

Parent-authenticated history now supports JSON export, deletion of one entry,
and deletion of all entries. The dashboard confirms destructive actions before
making the request.

## Parent accounts

Local parent accounts now support password hashing, signed HttpOnly session
cookies, and protected child-profile creation/listing endpoints. The shared
PIN remains as a local prototype fallback while account migration is tested.

Activity requests can now carry a selected child profile. The backend verifies
that the profile belongs to the signed-in parent before saving captures,
Wonder List explorations, quizzes, or stories.

## Reliability hardening

The backend now applies bounded JSON request sizes, rate limits to parent
authentication and AI-backed routes, retry guidance for throttled requests,
and non-cacheable responses for account and PIN authentication.

AI-backed backend routes now retry transient timeouts, connection resets, and
5xx/429 responses with bounded exponential backoff. Permanent validation
failures are returned immediately.
