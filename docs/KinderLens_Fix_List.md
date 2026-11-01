# KinderLens --- Fix List: Reading-Grade & Grounding Pipeline

Consolidated list of fixes identified while reviewing the working
prototype, in priority order.

## 1. Restructure the grounding pipeline (the core fix)

Change from single-stage to two-stage grounding:

-   **Extract first:** Pull 3--5 simple, kid-relevant facts from the raw
    Wikipedia article (what it is, what it does, one fun fact). This is
    a distillation pass, not full simplification yet.
-   **Simplify from the extracted facts,** not from the raw dense
    article. This removes the tug-of-war between "stay faithful to a
    complex source" and "write for a 6--8 year old."
-   **Ground the final explanation against the extracted facts,** not
    the raw article. This creates a much smaller, already-simple target,
    so grounding and simplicity stop competing.

## 2. Add a regeneration loop with a hard grade ceiling

-   If the generated explanation exceeds the target grade (aim for
    roughly Grade 1--2 for ages 6--8), re-prompt explicitly, asking for
    shorter sentences and simpler structure. Try 2--3 times.
-   Set a hard ceiling (e.g., never show above Grade 5--6), even after
    regeneration attempts.
-   If it still cannot get there, that is a sign the topic/source may
    not be simplifiable for this age band. Better to gracefully suggest
    a different topic than force through an overly complex explanation.

## 3. Keep the glossary feature, but as a supplement, not the fix

It is genuinely good for catching the occasional unavoidable hard term
in an otherwise well-simplified explanation (like it did for Telescope
at Grade 3.8). Just do not rely on it to rescue explanations that are
structurally too complex (long/complex sentences), since it only
addresses vocabulary, not sentence difficulty.

## 4. Log the reading grade for every generated explanation

Log the reading grade for every explanation, including ones that pass,
so the real distribution across all topics is visible before a demo
rather than discovering outliers by eyeballing screenshots.

## 5. Fix the mixed-script bug in Hindi output

"वulkan" (Devanagari + Latin mixed mid-word) appeared in the Volcano
story. Trace where a source/English term is leaking into Hindi
generation without being translated, likely in the same generation step
affected by the grounding issue above.

## 6. Decide the visibility of the raw-article citation link

"Verified via Book" currently links straight to the dense adult
Wikipedia article. Decide whether that should be reachable from the
child's play view (and, if so, labeled clearly as "for grown-ups") or
kept parent-dashboard-only.

## 7. Confirm the safety filter is actually being exercised

The "Flagged interactions: No safety flags recorded" section is empty.
Explicitly run the adversarial test set through the live pipeline to
confirm the filter is active and catching things, not just present with
nothing yet tested.

## 8. Decide on Wonder List sourcing, if time allows

Currently a static curated list rather than one pulled live from
Wikipedia pageview data. This is fine as-is for now, but the report
should describe it accurately rather than claiming live trending data if
it is not yet implemented.

# Knowledge Graph / Discovery Map --- Remaining Work

What exists today (the Discovery Map: per-object relationship branches,
a visual trail, and "Start a new trail") is a real working feature, but
it is a topic browser, not yet a genuine knowledge graph tied to the
child's own learning history.

To fully claim the original stretch goal:

## 9. Make the graph persistent and tied to the child's actual history

Right now, Discovery Map branches appear to be generic topic suggestions
(Telescope → Science/Space/Stars), rather than links built from objects
the child has actually captured.

A real knowledge graph should connect "the telescope you found
yesterday" to "the volcano you found today" based on real overlap, not
just show a fixed relationship tree per topic in isolation.

## 10. Fact-ground the the relationship text itself, not just the object explanations

Connector phrases shown in the map (e.g., "A telescope helps us see far
away") need the same grounding-verification treatment as the main
explanations.

Right now, it is unclear whether these are checked against real sources
or generated freely. An invented-but-plausible connection is exactly the
kind of subtle hallucination that is hard to catch.

## 11. Build the actual spaced-repetition scheduling algorithm

This is the core algorithmic piece with no off-the-shelf equivalent
elsewhere in the pipeline.

The review quiz (pulling questions from Volcano/Book/Telescope together)
looks manually triggered with a question-count selector---not like a
system that tracks when each object was last reviewed, how the child
performed, and resurfaces it at increasing intervals (1 day, 3 days, 1
week, etc.) based on that performance.

## 12. Connect resurfaced reviews back into the main flow

Once scheduling exists, the home screen or Wonder List should
proactively surface "it's time to revisit X" based on the schedule,
rather than leaving the review quiz as a separate, manually initiated
screen.

## Scope Note

Items **11--12** are the hardest, highest-risk work remaining---the same
caution that applied when this stretch goal was first scoped.

If time is tight, **9--10** (persistence + grounding the existing
Discovery Map) are smaller, safer wins that make what is already built
more defensible, even without full spaced repetition.
