# Evaluating SystemIQ scoring

Run manually from `backend/`. This suite is deliberately absent from CI: live runs consume provider quota and cost money if a paid model is selected.

```powershell
# Offline harness check; no API key or external services needed.
$env:MOCK_MODE = "true"
npm run eval

# Live run: supply OPENROUTER_API_KEY through your environment or .env.local first.
$env:MOCK_MODE = "false"
npm run eval
```

Live mode fails without a key; it never silently falls back to mock mode. Existing environment
variables take priority over `.env.local` and `.env`. Optional `OPENROUTER_MODEL` and
`OPENROUTER_FAST_MODEL` select the production evaluator and intent models respectively;
both default to `nvidia/nemotron-3.5-super-vl:free`. Other production LLM settings apply unchanged.

## Method

The smaller default suite has 21 fixed, synthetic candidate answers across URL shortener,
rate limiter and notification system. Every one of the seven interview stages has a strong
answer, a partially correct answer, and either a weak or off-topic answer (7 strong, 7 partial,
4 weak, 3 off-topic). Stage names and knowledge are loaded from the real catalog.
The fixture question sets the precise scope; the full stage objective and rubric still go to
the evaluator. These are independent snapshots, not a multi-turn conversation or diagram eval.

Live runs call the actual production `evaluateAnswer` and `classifyIntent` functions, with
their actual prompts, models, schemas and context builder. Expected scores, quality labels
and concept aliases never enter live model context. Each scoring case runs **N=3** times;
15 intent messages run once each, covering ANSWER, QUESTION, CLARIFICATION, WRAP_UP,
SMALL_TALK and ACKNOWLEDGEMENT, including clarification/ending boundary cases.
That is **78 model calls** per default live run, sequentially. The production SDK can retry
twice, so HTTP attempts and cost can exceed 78. Allow time for provider latency and timeouts.

The fixtures encode human expectations, not golden model outputs: strong 7–10, partial 4–7,
weak 0–4, off-topic 0–2. A low-quality relevant answer should still be recognized as answering
the question. Each case specifies its expected `answeredCurrentQuestion` and must-mention
concept groups. Review these expectations before changing score ranges; do not widen them
merely to make a failing model pass.

**Mock runs are intentionally trivial.** An eval-local synthetic oracle uses fixture expectations
to return schema-valid midpoints, booleans and concepts. This exercises validation, reporting
and the command offline; it does **not** call the production mock model and proves nothing
about scoring quality or variance. Production mock code is untouched. Unit tests inject bad
outputs and failures to check that the harness can reject them.

## Reading results

The console and latest table show each scoring fixture's mean, population standard deviation
(`sqrt(sum((score - mean)^2) / N)`) and PASS/FAIL. A fixture passes only if **all three runs**:

- Return output passing the exact production Zod schema.
- Land inside the inclusive score range and match `answeredCurrentQuestion`.
- Mention every expected concept group somewhere in evaluator feedback (topics, strengths,
  weaknesses, architectural choices, assumptions, criteria, missing concepts or reasoning).
- Have population standard deviation at most the fixture's `maxStdDev` (currently 1.5).

Concept groups use OR aliases within each group and AND across groups, with Unicode/case/
punctuation normalization and whole-token phrase matching. Only evaluator output is searched,
never the candidate answer. This is a lexical diagnostic, not semantic proof; inspect alias
coverage when a concept check fails. Missing concepts can appropriately appear in weaknesses.

Each intent message passes only on an exact label match. Both scoring fixture pass rate and
intent accuracy must independently be **at least 85%**, or the command exits nonzero.
With the default counts this requires at least 18/21 scoring fixtures and 13/15 intents.
Failed calls and invalid output stay in the denominator; a partial mean uses only valid scores
but can never turn an incomplete fixture into a pass. No harness-level retries hide failures.
N=3 and 15 intents are a compact regression signal, not statistical certification of fairness.

Every run saves `results/<UTC-timestamp>.json` and refreshes the marked latest table below.
Artifacts record mode, model identifiers, corpus/knowledge/agent/harness SHA-256 fingerprints,
durations, per-run scores, boolean/concept diagnostics and expected/actual intent labels.
They omit candidate messages, raw model feedback, API keys, headers and provider errors.
Error categories are deliberately safe (`invalid_output`, `model_call_failed`). Compare runs
with matching fingerprints/model IDs; inspect `scoring[].runs` for the failing dimension.
Keep a prior live artifact when running a mock check: the latest table always shows the most
recent run, including mocks. The initial results were recorded without a real key during
implementation; they are a mock harness check only.

## Latest results

<!-- latest-results:start -->

Run: 2026-11-08T06:06:48.245Z. Mode: **MOCK** (harness-only; synthetic oracle).

Artifact: [JSON](results/2026-11-08T06-06-48-245Z.json). Evaluator: synthetic-oracle; intent: synthetic-oracle.

Scoring: 100.0%; intent accuracy: 100.0%.

| Fixture | Mean | Stdev | Result |
| --- | ---: | ---: | --- |
| url_shortener-requirements-strong | 8.50 | 0.00 | PASS |
| url_shortener-requirements-partial | 5.50 | 0.00 | PASS |
| url_shortener-requirements-weak | 2.00 | 0.00 | PASS |
| rate_limiter-high-level-design-strong | 8.50 | 0.00 | PASS |
| rate_limiter-high-level-design-partial | 5.50 | 0.00 | PASS |
| rate_limiter-high-level-design-off_topic | 1.00 | 0.00 | PASS |
| notification_system-core-flow-strong | 8.50 | 0.00 | PASS |
| notification_system-core-flow-partial | 5.50 | 0.00 | PASS |
| notification_system-core-flow-weak | 2.00 | 0.00 | PASS |
| url_shortener-data-model-strong | 8.50 | 0.00 | PASS |
| url_shortener-data-model-partial | 5.50 | 0.00 | PASS |
| url_shortener-data-model-off_topic | 1.00 | 0.00 | PASS |
| rate_limiter-reliability-strong | 8.50 | 0.00 | PASS |
| rate_limiter-reliability-partial | 5.50 | 0.00 | PASS |
| rate_limiter-reliability-weak | 2.00 | 0.00 | PASS |
| notification_system-scaling-strong | 8.50 | 0.00 | PASS |
| notification_system-scaling-partial | 5.50 | 0.00 | PASS |
| notification_system-scaling-off_topic | 1.00 | 0.00 | PASS |
| url_shortener-tradeoffs-strong | 8.50 | 0.00 | PASS |
| url_shortener-tradeoffs-partial | 5.50 | 0.00 | PASS |
| url_shortener-tradeoffs-weak | 2.00 | 0.00 | PASS |

<!-- latest-results:end -->
