# Age Rubric for Children Ages 6–8

Use this rubric for explanations and as a language check for quizzes and stories.
The source facts are the truth constraint; examples show writing style only.

## Writing targets

- Aim for a Flesch–Kincaid grade level of 1–2 for English and Hinglish summaries.
- Never show an English/Hinglish explanation above grade 6. Regenerate up to
  three times, then withhold it and invite the child to explore another topic.
- Use exactly three short sentences in an explanation summary. Prefer one idea
  per sentence and familiar words.
- Explain a necessary science or history word the first time it appears.
- Keep the fun fact to one or two short sentences and the action prompt to one
  safe thing a child can observe.
- Add no more than five vocabulary entries. Include a term only if it appears
  in the child-facing text and needs an explanation.
- In Hindi, use Devanagari throughout. Do not leave English letters inside a
  Hindi word. Do not apply English readability formulas to Hindi text.
- Use the requested language for quizzes and stories. Keep questions direct,
  avoid trick wording, and explain answers in a short sentence.

## Grounding and safety checks

- Every factual statement must follow from the supplied verified facts. Style
  examples must never supply facts for the current topic.
- Do not invent details to meet a sentence count. If the source cannot support
  a useful explanation, quiz, or story, withhold it and say so simply.
- Do not use first-person companion language, ask personal questions, or invite
  open-ended conversation.
- Do not suggest touching, tasting, smelling, or approaching an object that may
  be unsafe. Prefer looking, counting, or noticing from a safe distance.
- Block unsafe generated text before it reaches the child.

## Human review checklist

For each sampled result, a reviewer should record the topic, requested language,
generated text, readability score where applicable, source, and pass/fail notes.
Check that a child can explain the main idea after one reading, unfamiliar terms
are explained, all facts match the source, the language is consistent, and the
activity is safe. Review examples from camera captures and the Wonder List in
English, Hindi, and Hinglish before a demo.

The prompt uses three examples selected from the 50-example bank in
`ai-service/app/core/age_examples.py` for English and Hinglish. Hindi omits the
English examples to reduce script leakage. Automated checks do not replace the
human review above; no human-review result is claimed by this rubric.
