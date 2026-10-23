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
