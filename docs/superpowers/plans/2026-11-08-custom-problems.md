# Custom Problems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, inline as approved in chat. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Practice any high-level system design topic with an owned, validated generated knowledge pack.

**Architecture:** Classify and match in a fast structured call, then generate and validate a private pack only when needed. Store packs durably and resolve them through ownership checks during interview execution. Preserve built-in loader behavior and the current T7 picker flow.

**Tech Stack:** Node ESM, Express 5, Zod 4, LangChain/OpenRouter, Supabase, Redis, React 19, TypeScript, Vitest/Supertest/Testing Library.

**Spec:** docs/superpowers/specs/2026-11-08-custom-problems-design.md

## Global Constraints

- Topic length: 3–120 characters after trimming.
- Rate limit: 5 requests per 3600 seconds per authenticated user.
- Stage names and order: Requirements, High Level Design, Core Flow, Data Model, Reliability, Scaling, Tradeoffs.
- One regeneration after invalid output; no persistence of invalid packs.
- Never log candidate answers, transcripts, tokens, raw topics, generated packs or secrets.
- No T7 changes, screenshots, recordings, package changes, unrelated refactors or automatic hosted SQL execution.
- Keep report locking, computed scoring, ownership middleware and mock mode working.
- Existing checkout is chore/codex-setup; preserve earlier uncommitted tasks and do not create commits during this implementation.

## Task 1: Prove the custom endpoint is missing

**Files:** Create backend/test/custom-problems.test.js.

**Interfaces:** Consume the real problem/interview/report routers with existing mock services. Target POST `/api/problems/custom` -> `{ problem, matched }`, 200 for matches and 201 for generation; 400 invalid input, 401 missing auth, 422 rejected topic, 429 limit, 404 unowned IDs.

- [x] Write route tests before production changes, including:

```js
const result = await request(app).post('/api/problems/custom')
  .set('Authorization', 'Bearer mock-token-a')
  .send({ topic: 'Design LeetCode' });
expect(result.status).toBe(201);
expect(result.body.problem.custom).toBe(true);
```

- [x] Run `cd backend; npm test -- test/custom-problems.test.js`; confirm 404-versus-201 failure.

## Task 2: Classifier, generator and offline fixtures

**Files:** Create backend/src/agents/problemGenerator/schema.js, prompt.js, agent.js; create backend/src/services/mock/problemGenerator.js; modify backend/src/services/mock/llm.js; extend backend/test/custom-problems.test.js.

**Interfaces:** `classifyTopic(topic, candidates)` -> `{ classification, matchedProblemId, suggestedHldTopic }`; `generateProblem(topic, id)` -> a validated KnowledgeBundleSchema pack. Classifications are SYSTEM_DESIGN, LOW_LEVEL_DESIGN and NOT_A_DESIGN_PROBLEM.

- [x] Add tests for rejection, builtin match, exact seven stages, invalid-pack retry, exhaustion and delimited JSON containing hostile topic text.
- [x] Run the focused tests and observe missing behavior.
- [x] Define the classification Zod schema and use KnowledgeBundleSchema for structured generation and final parsing. Bind a dedicated 16384-token generation model without changing shared interview-model limits.

```js
for (let attempt = 0; attempt < 2; attempt++) {
  try {
    const pack = KnowledgeBundleSchema.parse(await structured.invoke(messages));
    if (pack.problem.id !== id) throw new Error('Invalid generated identifier');
    return pack;
  } catch (error) {
    // Retry parser/schema failures only; provider outages return a safe error.
  }
}
throw Object.assign(new Error('The generated brief could not be validated. Please try again.'), { status: 502 });
```

- [x] Mock the new exact schemas using valid offline fixtures, preserving every existing mock schema.
- [x] Run focused tests until classifier, validation and retry behavior pass.

## Task 3: Owned persistence, brief projection and routes

**Files:** Create backend/src/services/problem/customProblem.service.js; modify backend/src/services/problem/problem.service.js, backend/src/routes/problem.routes.js, backend/src/middleware/validate.js (new schema only), backend/src/services/mock/supabase.js; extend backend/test/custom-problems.test.js; update README.md.

**Interfaces:** `CustomProblemService.create(userId, topic, candidates)` -> `{ problem, matched }`; `.get(id, userId)` -> owned row or 404; `.list(userId)` -> owned rows; `.knowledge(id, userId)` -> validated pack with top-level id. `ProblemService.get(id, userId?)` -> brief; `.getAll(userId?)` -> built-ins plus owned custom briefs. `Schemas.customProblem` validates topic.

- [x] Add owner list/detail/start, safe projection, sixth-request rejection and public-list privacy tests; run them red.
- [x] Add the in-memory custom_problems table.
- [x] Query every private read with both id/user_id as applicable. Project problem fields, estimatedDuration, difficultyLevels and concepts; append custom=true, never return the knowledge column.

```js
const { data, error } = await supabase.from('custom_problems')
  .select('*').eq('id', id).eq('user_id', userId).maybeSingle();
if (error) throw Object.assign(new Error("Custom challenge storage is unavailable"), { status: 503 });
if (!data) throw Object.assign(new Error('Problem not found'), { status: 404 });
```

- [x] Register POST custom before GET detail, with auth -> rateLimit({ name: 'custom-problem', limit: 5, windowSeconds: 3600 }) -> validate -> handler. Add optional authentication to GET list/detail so anonymous users retain built-ins and invalid tokens are rejected.
- [x] Add README SQL: text primary key matching custom_[0-9a-f]{32}, user FK, bounded topic, slug, jsonb knowledge, created_at, user/date index, enabled RLS, owner SELECT policy, explicit grants and revoked client writes.
- [x] Run route tests; confirm B cannot discover or start A's custom problem.

## Task 4: Load custom knowledge during all interview transports

**Files:** Modify backend/src/services/knowledgeLoader.js, backend/src/routes/interview.routes.js (start only), approved backend/src/services/interview/interview.service.js; extend backend/test/custom-problems.test.js.

**Interfaces:** `loadKnowledge(problemId, userId?)` returns the existing built-in object or an owned custom-pack promise. The three interview callers await both forms and pass session.interview.userId.

- [x] Write end-to-end tests: create custom -> start -> initialize -> ordinary message -> streamed message -> wrap up -> persisted report. Add direct loader owner and traversal tests.
- [x] Run focused tests and observe custom start/load failure.
- [x] Resolve start metadata with `await ProblemService.get(problemId, req.user.id)`; leave remaining start behavior unchanged.
- [x] Guard loadKnowledge IDs before any path join. Resolve custom namespace through CustomProblemService.knowledge; never read a custom ID from disk.
- [x] Change the three calls to `await loadKnowledge(session.interview.problemId, session.interview.userId)`.
- [x] Run focused and full backend tests.

## Task 5: T7 custom-topic picker flow

**Files:** Modify frontend/src/services/problem.service.ts, frontend/src/pages/ProblemPage.tsx, frontend/src/components/problems/problem.model.ts, ProblemCard.tsx, DifficultyModal.tsx; create CustomTopic.tsx and custom-topic.test.tsx under frontend/src/components/problems/; add frontend/src/services/problem.service.test.ts.

**Interfaces:** `createCustomProblem(topic, signal?)` -> `{ problem, matched }`; authenticated getProblems/getProblem retain their signatures. Challenge adds custom:boolean. `CustomTopic({onPrepared})` calls onPrepared(problem, matched); ProblemPage upserts the brief, clears filters and opens existing level selection.

- [x] Write failing UI/service tests for examples, inline topic length, pending state, duplicates, rejection/rate-limit/network errors, late responses, matched builtin, generated custom and custom badges.
- [x] Run `cd frontend; npm test -- --maxWorkers=2 src/components/problems/custom-topic.test.tsx src/services/problem.service.test.ts` and confirm failures.
- [x] Add auth headers to problem requests; reject non-OK HTTP statuses and malformed response envelopes. Never display arbitrary provider messages.
- [x] Compose input, example buttons, submit/pending/error states with T7 controls and Reveal/Stagger. Animate while the request is actually pending, respect reduced motion and do not add a fake completion timer.
- [x] Preserve custom flag through parseChallenge; show AI-generated badges on card/detail. Upsert returned problems by id and open the existing detail/level modal.
- [x] Run focused and existing picker tests, lint and TypeScript.

## Task 6: Verification and handoff

**Files:** Update this plan's checkboxes only; implementation stays in the approved file set.

- [x] `cd backend; npm test -- --maxWorkers=2` -> all 190 tests pass.
- [x] `cd frontend; npm run lint`, `npx tsc -b`, `npm test -- --maxWorkers=2`, `npm run build` -> all pass.
- [x] Run mock eval harness checks if loader compatibility changes require them; no paid model calls.
- [x] Browser-check a new custom topic through a complete interview and saved report, keyboard interaction, AI-generated badge, and 320px layout. Do not capture or save media.
- [x] Confirm T7 files unchanged, inspect task diff, stop only the isolated test server and remove test request forwarding.
- [x] Report changed files, tests, mock-versus-live verification and the README SQL manual setup step.

## Verification results

Backend: 190/190 tests passed. Frontend: 176/176 tests passed. Frontend lint, TypeScript and production build passed. A mock browser interview on a custom payment-system topic completed through streamed messages and a saved report (HTTP 200). Owner isolation, builtin matching, the HLD suggestion and a 320px layout passed. T7 UI/motion hash remained unchanged. The separate test backend and browser forwarding were cleaned up. No hosted SQL or paid model calls ran; README table setup remains a deployment step.
