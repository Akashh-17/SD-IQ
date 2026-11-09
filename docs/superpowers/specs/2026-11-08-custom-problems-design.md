# Private custom system design problems

Approved in chat on 2026-11-08. Execute inline in the existing checkout, preserving all earlier work. Do not capture screenshots or recordings, change T7, or commit unrelated changes.

## Flow

The authenticated POST `/api/problems/custom` accepts a trimmed topic of 3–120 characters. Reuse the existing per-user Redis limiter with a five-request, 3600-second window. Validation follows authentication and rate limiting. A structured fast-model call classifies the topic and may identify a clear match among built-ins and the requesting user's existing custom briefs. Non-design topics return 422; low-level topics return 422 with a suggested high-level version. Unknown or unowned match IDs are never trusted.

A new system-design topic receives a server-generated `custom_` plus 32 lowercase hexadecimal characters identifier. This fits the existing safe problem-ID schema, reserves a recognizable namespace, and never becomes a filesystem path. A dedicated generation model has a larger output budget than interview turns. Its structured response contains problem, interview, evaluation, architecture and graph. The existing KnowledgeBundleSchema remains the final authority, including stage order, required criteria/rubric alignment, reference graph consistency and arithmetic. Regenerate once on invalid output; save nothing after two invalid attempts. Provider failures return a safe retryable error.

Topic text is serialized inside a delimited JSON data field. System prompts explicitly prohibit following instructions embedded in topics. Catalog IDs returned by the model must match an actual server-supplied candidate. The requested pack ID must match the generated pack's problem ID.

## Persistence and access

`custom_problems` stores text id, authenticated user_id, original topic, normalized slug, validated knowledge JSON and created_at. Reads always filter by user_id, even though the server uses a privileged client. README SQL enables RLS and an owner-only SELECT policy; authenticated clients cannot insert or mutate packs directly. Only the backend service role writes validated packs. Public API responses expose brief metadata and `custom: true`, never the rubric, graph or reference architecture.

Anonymous problem-list requests keep returning built-ins. Authenticated list requests append only that user's custom problems. Authenticated detail and start requests use the same owner-checked resolution. Unknown and unowned custom IDs return 404. Built-ins retain their existing path-name checks, and knowledgeLoader gains its own explicit traversal guard.

## Knowledge integration

Preserve synchronous built-in loadKnowledge behavior for existing tests and evals. The custom branch returns a database-read promise and requires a user ID. The interview service's initialize, ordinary message and streaming message paths await either result and supply the trusted session owner. There is no process-local custom-pack cache, so resuming after a process restart uses durable storage and fresh ownership checks.

## UI

A prominent T7 card accepts a topic, with example chips for LeetCode, a payment system and Google Docs. Submission shows a reduced-motion-aware pending animation while the real request runs; no artificial 5–15-second delay or fabricated progress percentage. The response inserts or updates the returned brief and opens the existing detail/level modal. Existing filters reset so the returned problem is visible. Custom cards and their detail briefs show an AI-generated badge. Rejection, rate-limit, network and storage/setup failures have safe actionable messages. Duplicate clicks cannot start simultaneous requests, and unmounted components ignore late results.

## Offline mode and verification

The fast mock classifier handles the three labels and catalog matches. The generation mock returns an explicitly offline fixture pack that passes the same full schema as production. Add custom_problems to the existing in-memory table adapter. Tests cover invalid topics, classification rejection and HLD suggestions, built-in matching, pack validation and retry/exhaustion, prompt boundaries, owner isolation on list/detail/start/knowledge reads, public-list privacy, rate limits and an entire custom interview through report persistence. Frontend tests cover submission, examples, pending/duplicate guards, friendly errors, matched/generated responses and custom badges.

Run backend tests, frontend lint, TypeScript, frontend tests and production build. Exercise keyboard/mobile and a full mock custom interview in the browser without capturing media. README SQL is a manual hosted-database setup step; do not execute it against a connected project automatically.

## Approved scope additions

- Three awaited knowledge loads in backend/src/services/interview/interview.service.js.
- A custom_problems table in backend/src/services/mock/supabase.js.
- This design and the matching implementation plan under docs/superpowers/.
