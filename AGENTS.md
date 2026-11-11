# AGENTS.md: SystemIQ

## What this is
AI system design mock-interview PRACTICE platform. Candidates pick a problem, answer by text or voice,
draw their architecture on an Excalidraw whiteboard, and get scored stage by stage.

## Stack
- backend/: Node 20+ (LangChain 1.x; Vite 8 requires Node 20.19+ or 22.12+) ESM JavaScript (NOT TypeScript), Express 5, LangGraph (@langchain/langgraph),
  @langchain/openai pointed at OpenRouter, Upstash Redis (REST), Postgres checkpointer, Supabase (auth + tables), Zod, Groq Whisper.
- frontend/: React 19 + TypeScript + Vite, Tailwind 3, Excalidraw 0.18 (whiteboard), framer-motion, Recharts, lucide-react, Supabase JS.

## Key architecture (read before changing anything)
- backend/agent.js: LangGraph graph: START -> greeting -> interviewer -> END for the initial greeting, or greeting -> input -> graphAnalyzer -> intent -> orchestrator -> optional evaluator -> conversationManager -> interviewer -> END.
- Session state: Redis keys interview:<id>, :transcript (RPUSH list), :graph, :analysis (see backend/src/services/interview/session.service.js). Never go back to read-modify-write on one key.
- Report generation is idempotent (Redis SET NX EX lock at lock:report:<id> + interview upsert + graph/report delete-and-insert, report row written last). Don't weaken this.
- Scores come from code (computeStageScores in backend/src/services/report/reportGenerator.js; overallScore is also overridden in code), not from the LLM.
- Whiteboard: Excalidraw. frontend/src/components/excalidraw/converter.ts turns the drawing into { nodes, edges } (library components via customData.componentType, labelled shapes, arrows bound at both ends); that graph is what the backend/AI reads. The full drawing is saved separately in Redis key interview:<id>:scene and never enters agent state.
- Diagram analysis reuses successful analysis for unchanged structure (backend/src/utils/graphSignature.js); missing/failed analysis can retry. Graph-edit analysis is debounced for 2 seconds by backend/src/services/graph/graph.service.js.
- Intent labels: IntentType in backend/src/models/InterviewEnums.js (ANSWER, QUESTION, ACKNOWLEDGEMENT, SMALL_TALK, CLARIFICATION, WRAP_UP, UNKNOWN), the single source of truth.
- Security: /message, /graph and /end = auth -> rateLimit -> validate (Zod) -> ownsInterview; /initialize and /state/:interviewId omit rateLimit; /start = auth -> rateLimit -> validate, then creates the owned session. Ownership failures return 404, not 403.
- Paths come from backend/src/config/paths.js (BACKEND_ROOT, KNOWLEDGE_DIR, UPLOADS_DIR, LOG_FILE); backend/src/config/env.js loads .env.local before .env without overriding existing environment variables. Never use process.cwd().

## Rules
- One task = one focused change. Stay inside the files the task scopes; never edit files owned by other tasks.
- Keep existing behavior unless the task says otherwise. Don't reformat unrelated code.
- Match the surrounding style (the backend uses blank-line-spaced code and section comments).
- Never log candidate answers, transcripts, tokens or secrets. Never put the Supabase service role key in the frontend.
- Never remove the attribution to the original project in README.md.
- Add or update tests for every behavior change. MOCK_MODE is planned for T1 and is not implemented yet; once added, keep it working (offline demo + CI).
- UI: use frontend/src/components/ui; frontend/src/motion is planned for T7; respect prefers-reduced-motion.

## Commands (run before finishing; show the output)
- backend: npm test
- frontend: npm run lint && npx tsc -b && npm test && npm run build
- e2e (after T14): cd frontend && npx playwright test

## Definition of done
All commands pass; the summary lists the files changed, decisions made and anything left undone; screenshots for UI work.
