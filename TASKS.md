# SystemIQ: Bug Fix Tasks

Work through these in order. Each task is small enough to finish and test on its own.

---

## 🔴 Phase 1: Critical bugs (wrong interview behavior)

### Bug 1: Diagram saves re-run the whole interview
Every canvas change, even dragging a node, triggers a full agent run. That run re-scores the last answer and generates a hidden question.

- [x] **1.1** `analyzeGraph` now runs only the diagram LLM analysis and stores the result with the graph in Redis. It no longer invokes the agent.
- [x] **1.2** `saveGraph` saves right away and debounces analysis by 2s with `GraphService.scheduleAnalysis`.
- [x] **1.3** Done on the backend instead of the frontend. `utils/graphSignature.js` fingerprints the graph without positions, so moves are saved but not analyzed. `graphNode` reuses the stored analysis when nothing changed, which also covers Bug 10.
- [ ] **1.4** Test: drag a node 10 times and confirm no new interviewer messages or evaluator logs appear.

### Bug 2: "Wrap up" never ends the interview
The intent schema returns `"WRAPUP"`, but the decision engine checks for `"WRAP_UP"`.

- [x] **2.1** Intent values (uppercase, `WRAP_UP`) are now defined once as `IntentType` in `backend/src/models/InterviewEnums.js`.
- [x] **2.2** The schema, orchestrator and decision engine all use `IntentType`.
- [x] **2.2b** `/message` returns `completed: true` when the interview ends, and the chat opens the report. `/end` no longer fails if the report already exists.
- [ ] **2.3** Test: say "I'm done, let's wrap up" and confirm the report is generated.

### Bug 3: Report only reflects the last answer
`setEvaluation` overwrites `candidate.evaluation`, `strengths` and `weaknesses` every turn.

- [x] **3.1** Added `evaluations` to `backend/src/state.js` with an append reducer.
- [x] **3.2** `setEvaluation` appends an entry with stage, question, answer and score. Failed evaluations are skipped.
- [x] **3.3** The report prompt gets the full history. The overall score and stage scores are now calculated from the evaluator's scores, and the LLM only writes the feedback.
- [ ] **3.4** Test: give a strong answer, then a weak one, and confirm the report reflects both.

---

## 🟠 Phase 2: Security

### Bug 4: Users can access other users' interviews
- [x] **4.1** `middleware/ownsInterview.js` checks the owner against the Redis session for live interviews, or the Supabase `interviews` row for finished ones. A mismatch returns **404**, not 403, so other users' interview IDs can't be confirmed to exist.
- [x] **4.2** Applied to `/initialize`, `/message`, `/graph`, `/end` and `/state/:interviewId`.

### Bug 5: Unprotected routes
- [x] **5.1** `/api/report/:id` now requires login and returns 404 unless the report belongs to the caller. `getReport` returns `null` instead of throwing when the report doesn't exist yet. `ReportPage.tsx` sends the auth header.
- [x] **5.2** `/api/voice/transcribe` now requires login, and `voiceService.ts` sends the auth header.
- [x] **5.3** Uploads are limited to 10MB, one file, `audio/*` only, with a fixed list of allowed extensions. Upload errors return 400.
- [x] **5.4** Added `middleware/rateLimit.js`, a fixed-window limiter in Upstash Redis keyed per user, so limits hold across server instances. It adds no new dependency, and it lets requests through if Redis is down. Limits per minute: start 10, message 30, graph 240, end 10, transcribe 20.

### Bug 6: No input validation
- [x] **6.1** `middleware/validate.js` checks requests with Zod schemas: UUID `interviewId`, message of 1–4000 characters (trimmed), difficulty `SDE1`/`SDE2`/`Senior`, graph up to 200 nodes and 400 edges.
- [x] **6.2** `ProblemService.get` rejects any ID that isn't `[a-z0-9_]`, which blocks `../`. A missing problem returns 404 instead of 500.
- [ ] **6.3** Test the whole security phase end to end: two accounts, where account B requests account A's interview and report and gets 404 for both.

---

## 🟡 Phase 3: Reliability

### Bug 7: Ending an interview can fail or run twice
- [x] **7.1** `ReportService.generate` is safe to repeat:
  - If the report is already saved, it returns it.
  - A Redis lock (`SET NX EX 120`) lets only one caller generate. Others wait for the result, so the End button and the agent's "wrap up" can't produce two reports.
  - A report generated on an earlier failed attempt is reused, avoiding a second LLM call.
- [x] **7.2** `PersistenceService.save` can be retried: the interview row is upserted on `interview_id`, and graph and report rows are replaced, not duplicated. The report row is written last, so "report exists" means everything was saved.

### Bug 8: Concurrent writes overwrite each other in Redis
- [x] **8.1** The transcript is a Redis list (`interview:<id>:transcript`) appended with `RPUSH`.
- [x] **8.2** The graph (`:graph`) and its analysis (`:analysis`) each have their own key, so a diagram save and a background analysis can't overwrite each other. `SessionService.save` now writes only metadata and the report. `get()` still returns the same combined session shape.
- [x] **8.3** All keys have a 24h TTL, refreshed on every write, so active interviews never expire.

### Bug 9: Fragile LLM JSON in graph analysis
- [x] **9.1** `agents/graph/schema.js` holds a Zod schema, and `graphNode` uses `llm.withStructuredOutput`. A failed analysis returns `null` and isn't cached, so it's retried.
- [x] **9.2** Done in Bug 1. Edges also now reach the LLM as node labels instead of raw IDs.
- [x] **9.3** Done in Bug 1.

### Bug 10: Graph LLM call runs on every message
- [x] **10.1** Done as part of Bug 1.
- ~~**10.1**~~ In `graphNode`, skip the LLM call unless the graph changed (use the existing `graphDirty` flag, or a hash of the nodes and edges).

### Bug 11: Paths depend on the working directory
- [x] **11.1** `config/paths.js` resolves the knowledge, uploads and log paths from its own location (works on Node 18, unlike `import.meta.dirname`). `config/env.js` loads `.env.local` and `.env` from the backend folder. Updated: knowledge loader, problem service, logger, voice uploads, `llm.js`, `redis.js` and `server.js`. `uploads/` and `sample.txt` are now gitignored.
- [ ] **11.2** Test: start the server from the repo root (`node backend/server.js`) and confirm problems load.

### Bug 12: Interviewer had no memory
`memory` was read by the evaluator, conversation manager and interviewer, but nothing ever wrote to it.
- [x] **12.1** `services/memoryBuilder.js` runs after every interviewer turn, with no extra LLM call. It stores the last 10 questions asked and a summary of the last 6 evaluated answers (stage, question, answer, score, missing concepts). It's wired up in `nodes/interviewNode.js`.

### Bug 13: Interview never ended after the last stage
- [x] **13.1** In `decisionEngine.js`, finishing the last stage now returns `END_INTERVIEW` instead of `MOVE_TOPIC`, so the candidate gets a closing message and a report.

### Bug 14: Unclear messages acted on the previous answer's score
- [x] **14.1** An `UNKNOWN` intent now returns `FOLLOW_UP`, which rephrases the question, instead of falling through to logic that reads the previous turn's evaluation.

### Bug 15: Hardcoded CORS origins
- [x] **15.1** `server.js` reads `CORS_ORIGINS` (comma-separated) and defaults to `http://localhost:5173`. The README is updated.
- [ ] **15.2** Set `CORS_ORIGINS` on your backend host to include your deployed frontend's URL.

### Manual test for 12–14
- [ ] Play a full interview through every stage. Check that the interviewer doesn't repeat questions, that the interview ends with a closing message and opens the report, and that an unclear reply like "hmm" gets a rephrased question.

---

## 🎯 Demo hardening

- [x] **D1** LLM calls time out after 30s (`LLM_TIMEOUT_MS`) and retry twice. The default model is now `openai/gpt-4o-mini`; the old bare `gpt-4o-mini` wasn't a valid OpenRouter id.
- [x] **D2** The interviewer gets only the fields its prompt uses, instead of the entire state. In a mid-interview example the context went from about 36,000 to 1,350 characters. It also now receives the candidate's message for `ANSWER` decisions; `candidateQuestion` was never filled in before.
- [x] **D3** Intent and conversation style can use a faster model (`OPENROUTER_FAST_MODEL`), which defaults to the main model.
- [x] **D4** The chat shows specific errors for 400, 401, 404, 429 and network failures. Reloading a finished interview opens its report instead of an empty chat.
- [x] **D5** `GET /health` checks Redis and Postgres (200 or 503, with a 3s timeout per check). Added `.env.example` files for both apps.
- [ ] **D6** Measure turn latency with real keys, with and without `OPENROUTER_FAST_MODEL`, and record the numbers.

---

## ⚪ Phase 4: Cleanup

- [x] **C1** Removed dead backend code, confirmed unused by tracing imports from `server.js`:
  - `src/sockets/` and the `runAgent` function, which only the socket code used
  - `models/InterviewSession.js`, `services/topicEngine.js`, `services/graphparser.js`, `services/interviewLogger.js`, `services/graph/graphContextBuilder.js` and `utils/parser.js`
  - Kept on purpose: `agents/interviewer/schema.js`, which documents the interviewer's output shape.
- [x] **C2** Deleted `testRedis.js` and the two zip files, which were old copies of the knowledge JSON (one still had the `url_shortner` typo). `sample.txt` is no longer tracked by git and is gitignored.
- [x] **C3** Removed unused frontend files, confirmed by tracing imports from `main.tsx`. This covers `App.tsx`/`App.css`, the whole `architecture/` folder (an older canvas that isn't used), `components/analytics/`, unused UI and effect components, `types.ts`, `graphAnalysis.service.ts` and unused images. All of them can be recovered from git history.
- [x] **C4** Removed unused dependencies:
  - Backend: `@google/genai`, `@google/generative-ai`, `axios`, `ioredis`, `langchain`, `openai`, `react-router-dom`, `redis`
  - Frontend: `@huggingface/transformers`, `react-countup`
  - `@langchain/core` and `pg` stay; LangChain and the Postgres checkpointer need them.
  - Both lockfiles were regenerated, and `npm ci` succeeds.
- [x] **C5** Debug `console.log`/`console.dir` calls now use `log()`. The logger writes through a non-blocking stream instead of `appendFileSync`, and `LOG_TO_FILE=false` turns it off. Transcripts are no longer logged; only their sizes are.
- [x] **C6** Page title is now "SystemIQ: AI System Design Interviews".
- [x] **Verified:** `tsc -b` and `npm run build` pass for the frontend. Every backend module imports cleanly, the agent graph builds, and all 5 problems load when the server runs from outside `backend/`.

---

## 🧪 Phase 5: Tests

- [ ] **13.1** Set up a test runner in the backend (Vitest or `node --test`).
- [ ] **13.2** Unit tests for `decisionEngine.js`, `sessionManager.js` and `orchestratorNode.js` (these are plain functions with no LLM calls).
- [ ] **13.3** Route tests for auth and ownership (Bugs 4–5) with the Supabase client mocked.
