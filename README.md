<div align="center">

# 🧠 SystemIQ

### AI-Powered System Design Interview Simulator

*Practice system design interviews with an AI interviewer that asks follow-ups, reads your architecture diagram, and scores you against a real rubric.*

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF6B35?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

**[Live Demo](https://system-iq.vercel.app)**

</div>

---

## 💡 What is SystemIQ?

SystemIQ is a full-stack web app that simulates a system design interview. You pick a problem and a target level, explain your design by typing or speaking, draw the architecture on a live whiteboard, and get a detailed report at the end.

**How a session works:**
1. **Pick a problem and level.** Choose from TinyURL, Instagram, Uber, Google Drive or a Chat App, at SDE1 or SDE2 difficulty.
2. **The interview runs in stages.** The AI interviewer moves through requirements, high-level design, deep dive, scaling and trade-offs, then wraps up.
3. **Draw your architecture.** Sketch on an Excalidraw whiteboard: drag in clients, load balancers, services, caches, queues, databases, storage, search and CDNs, connect them with arrows, and add your own shapes, zones and notes.
4. **The AI cross-checks you.** Every answer is scored against a per-problem rubric, and your diagram is compared with what you said. It flags components you mentioned but didn't draw, and the reverse.
5. **Get your report.** You see an overall score, a breakdown by stage, your strengths and weaknesses, and recommendations. Reports are saved to your history so you can track progress.

---

## ⚙️ Tech Stack

### Backend: `/backend`
| Technology | Role |
|---|---|
| **Node.js** (ESM) + **Express 5** | REST API server |
| **LangGraph** (`@langchain/langgraph`) | Multi-agent state machine that runs the interview |
| **LangChain** + **OpenRouter** | LLM calls through an OpenAI-compatible API (any OpenRouter model, default `nvidia/nemotron-3.5-super-vl:free`), with timeouts and retries |
| **PostgreSQL** (`@langchain/langgraph-checkpoint-postgres`) | Saves LangGraph state so interviews survive restarts |
| **Upstash Redis** | Live session store (transcript, diagram, scores) during an interview |
| **Supabase** | Auth (JWT verification) and Postgres for interviews, reports and diagrams |
| **Groq Whisper** (`whisper-large-v3-turbo`) | Speech-to-text for voice answers |
| **Zod** | Schemas that validate every agent's structured output |
| **Multer** | Handles audio uploads |

### Frontend: `/frontend`
| Technology | Role |
|---|---|
| **React 19** + **TypeScript** + **Vite** | UI framework and build tool |
| **Excalidraw** | Hand-drawn architecture whiteboard (component library, arrows, shapes, pen, PNG/SVG export) |
| **react-resizable-panels** | Split-pane interview layout (chat and diagram) |
| **Recharts** | Score-trend and progress charts |
| **Framer Motion** | Animations and transitions |
| **Tailwind CSS 3** | Styling |
| **Supabase JS** | Client-side sign-up, login and session handling |
| **MediaRecorder / Web Speech API** | Records the mic in the browser and reads AI replies aloud |

---

## 🤖 How the AI Works

The interview is a **LangGraph `StateGraph`** ([`backend/agent.js`](backend/agent.js)). Each node does one job, and the graph state is checkpointed to Postgres under the interview's ID.

```
START ─▶ greeting ─┬─▶ interviewer ─▶ END              (first turn)
                   └─▶ input

input ─▶ graphAnalyzer ─▶ intent ─▶ orchestrator ─┬─▶ evaluator ─▶ conversationManager ─▶ interviewer ─▶ END
                                                  └──────────────▶ conversationManager ─▶ interviewer ─▶ END
```

| Node | What it does |
|---|---|
| `greeting` | Loads the problem's knowledge base and opens the interview |
| `input` | Adds the candidate's latest message to the state |
| `graphAnalyzer` | Compares the current whiteboard with the problem's expected architecture and with what the candidate has said |
| `intent` | Classifies the message as `answer`, `question`, `clarification`, `acknowledgement`, `small_talk`, `graph_update` or `wrapup` |
| `orchestrator` | Sends real answers to the evaluator and everything else straight to the conversation manager |
| `evaluator` | Scores the answer against the problem's rubric and tracks strengths, weaknesses and concepts covered |
| `conversationManager` | Picks the next move (follow up, move on, give a hint or wrap up) and sets the tone |
| `interviewer` | Writes the next question for the current stage and objective |

Each agent in `src/agents/<name>/` has its own `prompt.js`, `schema.js` (a Zod output contract) and `agent.js`. That keeps prompts, output contracts and orchestration separate.

Diagram analysis is **debounced**. When the canvas changes, the backend waits briefly before running the analyzer, so quick edits don't each trigger an LLM call.

### Knowledge base

Each problem is a folder in [`backend/src/knowledge/`](backend/src/knowledge) with five JSON files:

| File | Contents |
|---|---|
| `problem.json` | Title, difficulty, description, functional and non-functional requirements, constraints |
| `interview.json` | Stages, objectives and question flow |
| `evaluation.json` | Scoring rubric and the concepts expected at each stage |
| `architecture.json` | Reference architecture and components |
| `graph.json` | The expected diagram nodes and edges used in diagram analysis |

To **add a problem**, create a new folder with those five files. The `/api/problems` endpoint finds it automatically.

---

## 📂 Project Structure

```
SystemIQ/
├── backend/
│   ├── server.js                   # Express entrypoint (initializes the agent, then listens)
│   ├── agent.js                    # LangGraph StateGraph definition
│   └── src/
│       ├── agents/                 # conversation / evaluator / intent / interviewer (prompt + schema + agent)
│       ├── nodes/                  # LangGraph node implementations
│       ├── config/                 # Upstash Redis and Supabase clients
│       ├── controllers/            # Route handlers (interview, graph, state, end, transcribe)
│       ├── knowledge/              # Per-problem JSON knowledge base
│       ├── middleware/auth.js      # Supabase JWT auth guard
│       ├── models/                 # Interview session model and enums
│       ├── routes/                 # interview / history / problem / report / voice
│       ├── services/               # Session, graph, report, LLM, checkpointer, transcription
│       └── state.js                # Shared LangGraph state schema
│
└── frontend/
    └── src/
        ├── components/excalidraw/  # Whiteboard: component library, drawing -> graph converter, icons
        ├── components/             # Landing, dashboard, history, report, analytics, UI kit
        ├── pages/                  # Landing, Login, Signup, Dashboard, Problems, Interview, Report, History, Progress
        ├── services/               # API clients that mirror the backend routes
        ├── config.ts               # API base URL
        └── lib/supabase.ts         # Supabase client
```

---

## 🔌 API Reference

Routes marked 🔒 need an `Authorization: Bearer <supabase-access-token>` header.

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/interview/start` | 🔒 | Create a session for a `problemId` and `difficulty`. Returns `interviewId` |
| `POST` | `/api/interview/initialize` | 🔒 | Start the agent graph and return the greeting |
| `POST` | `/api/interview/message` | 🔒 | Send a candidate message through the graph and get the interviewer's reply |
| `POST` | `/api/interview/graph` | 🔒 | Save the current whiteboard (nodes and edges) |
| `GET` | `/api/interview/state/:interviewId` | 🔒 | Get the live interview state (stage, progress, diagram analysis) |
| `POST` | `/api/interview/end` | 🔒 | End the interview, generate the report and save it to Supabase |
| `GET` | `/api/history` | 🔒 | List the signed-in user's past interviews |
| `GET` | `/api/report/:interviewId` | | Get the report for a completed interview |
| `GET` | `/api/problems` | | List all problems |
| `GET` | `/api/problems/:problemId` | | Get a single problem |
| `POST` | `/api/voice/transcribe` | | Upload audio (`multipart/form-data`, field `audio`) and get `{ transcript }` back |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- A **Supabase** project (for auth and the database)
- A **PostgreSQL** connection string for the LangGraph checkpointer. Your Supabase database's connection string works.
- An **Upstash Redis** database (REST URL and token)
- An **OpenRouter** API key (for the LLM)
- A **Groq** API key (only needed for voice input)

### 1. Clone the repo

```bash
git clone https://github.com/Akashh-17/SD-IQ.git
cd SD-IQ
```

### 2. Create the Supabase tables

Run this in the Supabase SQL editor:

```sql
create table interviews (
  id                 uuid primary key default gen_random_uuid(),
  interview_id       text unique not null,
  user_id            uuid references auth.users(id),
  title              text,
  difficulty         text,
  problem_difficulty text,
  status             text,
  overall_score      numeric,
  started_at         timestamptz default now(),
  completed_at       timestamptz
);

create table reports (
  id               uuid primary key default gen_random_uuid(),
  interview_id     uuid references interviews(id) on delete cascade,
  summary          text,
  strengths        jsonb,
  weaknesses       jsonb,
  recommendations  jsonb,
  stage_breakdown  jsonb,
  transcript       jsonb,
  report           jsonb,
  created_at       timestamptz default now()
);

create table graphs (
  id           uuid primary key default gen_random_uuid(),
  interview_id uuid references interviews(id) on delete cascade,
  graph        jsonb,
  analysis     jsonb,
  created_at   timestamptz default now()
);
```

You don't need to create the LangGraph checkpoint tables. The backend creates them on first start.

### Custom practice topics

Run this SQL in your own Supabase project before using **Practice any topic** in real mode. The backend saves validated knowledge packs with its service role; clients can read only their own brief metadata and cannot insert or modify the grading material directly.

```sql
create table if not exists public.custom_problems (
  id         text primary key check (id ~ '^custom_[0-9a-f]{32}$'),
  user_id    uuid not null references auth.users(id) on delete cascade,
  topic      text not null check (char_length(trim(topic)) between 3 and 120),
  slug       text not null,
  knowledge  jsonb not null check (jsonb_typeof(knowledge) = 'object'),
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists custom_problems_user_created_idx
  on public.custom_problems (user_id, created_at desc);

alter table public.custom_problems enable row level security;
revoke all on table public.custom_problems from public, anon, authenticated;
grant select (id, user_id, topic, slug, created_at)
  on table public.custom_problems to authenticated;
grant all on table public.custom_problems to service_role;

drop policy if exists "Read own custom problems" on public.custom_problems;
create policy "Read own custom problems"
  on public.custom_problems for select to authenticated
  using ((select auth.uid()) = user_id);
```

The problem picker accepts a high-level system design topic of 3–120 characters. It classifies the request, reuses a clear match from the built-ins or your own saved problems, or generates all five knowledge files. The pack must pass the same schema and cross-file checks as built-in knowledge; one invalid result is regenerated once. Requests are limited to five per hour per signed-in user. Low-level/OOP topics receive a suggested high-level version.

`PROBLEM_GENERATOR_MODEL` optionally selects an OpenRouter model for full-pack generation; it defaults to `OPENROUTER_MODEL` and then `nvidia/nemotron-3.5-super-vl:free`. Generation uses a separate 16,384-token output budget, preserving the interview models' limits. `PROBLEM_GENERATOR_TIMEOUT_MS` defaults to 45,000 milliseconds per attempt. Preparation time depends on the provider and topic; the UI stays pending until the real request finishes.

`MOCK_MODE=true` uses an explicitly offline fixture pack to exercise the full custom-topic interview without keys or a hosted database. Its reference architecture is a demo fixture, not a real assessment of the requested topic. Real mode always calls the configured model. Generated briefs are private, flagged **AI-generated**, and are not written into the built-in knowledge folders.

### 3. Set up the backend

```bash
cd backend
npm install
```

Copy the example file and fill it in. Every variable is explained in [`backend/.env.example`](backend/.env.example):

```bash
cp .env.example .env
```

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Yes | Project Settings → API. The service role key is secret; keep it on the backend only. |
| `DATABASE_URL` | Yes | Supabase → Connect → **Session pooler** string |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash database → REST API |
| `OPENROUTER_API_KEY` | Yes | openrouter.ai → Keys |
| `OPENROUTER_MODEL` | Recommended | Needs the provider prefix and tool-calling support. Defaults to `nvidia/nemotron-3.5-super-vl:free`. |
| `OPENROUTER_FAST_MODEL` | Optional | A faster model for intent and conversation style. Defaults to `OPENROUTER_MODEL`. |
| `GROQ_API_KEY` | For voice | console.groq.com → API Keys |
| `CORS_ORIGINS` | For deployment | Comma-separated frontend URLs. Defaults to `http://localhost:5173`. |
| `LOG_TO_FILE` | Optional | Set to `false` in production |

The default model is the [free NVIDIA Nemotron endpoint](https://openrouter.ai/nvidia/nemotron-3.5-super-vl:free), verified against OpenRouter’s catalog on 2026-11-09 for tool calling and JSON-schema output. It still needs `OPENROUTER_API_KEY` and is subject to free-model rate limits and availability. There is no automatic paid-model fallback. Reasoning is disabled for this endpoint to preserve the short classification output budget. Explicit model environment overrides remain supported.

Start the server:

```bash
npm run dev
```

It runs on `http://localhost:5000`. The server won't start if `OPENROUTER_API_KEY` or `DATABASE_URL` is missing. To check that Redis and Postgres are reachable, open `http://localhost:5000/health`. It returns `200` when both respond and `503` with details when either one doesn't.

### 4. Set up the frontend

```bash
cd frontend
npm install
```

Copy [`frontend/.env.example`](frontend/.env.example) to `frontend/.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Use the **anon** key here, never the service role key. `VITE_API_URL` defaults to `http://localhost:5000`.

```bash
cp .env.example .env
```

Start the dev server:

```bash
npm run dev
```

It runs on `http://localhost:5173`.

> The backend only accepts browser requests from the origins in `CORS_ORIGINS`, which defaults to `http://localhost:5173`. When you deploy the frontend, add its URL, for example `CORS_ORIGINS=http://localhost:5173,https://your-app.vercel.app`.

---

## ☁️ Deployment

- **Frontend:** deployed on Vercel. `frontend/vercel.json` rewrites every path to `index.html` so client-side routes work. Set the three `VITE_*` variables in the Vercel project settings.
- **Backend:** runs on any Node host that supports long-running processes, such as Render, Railway or Fly.io. Set the backend environment variables listed above, including `CORS_ORIGINS` with your frontend's URL, and point the host's health check at `/health`.

---

## ✨ Features at a Glance

- 🎙️ **Voice or text input.** Record your answer in the browser and Groq Whisper transcribes it.
- 🔊 **Spoken replies.** The interviewer's questions can be read aloud with the Web Speech API.
- 🖼️ **Live architecture whiteboard.** An Excalidraw canvas with 31 system-design components, labeled arrows, freehand drawing, zones and notes. The AI reads the components and connections.
- 🔍 **Diagram consistency check.** Flags concepts you mentioned but didn't draw, and the reverse.
- 📊 **Stage-based progression.** A structured flow with clear objectives for each stage.
- 🧠 **Adaptive interviewer.** Adjusts follow-ups, hints and focus based on how you're doing.
- 📋 **Detailed report.** Stage scores, strengths, weaknesses and recommendations.
- 📈 **Progress tracking.** History and score trends across sessions.
- 💾 **Resumable sessions.** Interview state is checkpointed in Postgres and cached in Redis.
- 🔐 **Authentication.** Supabase auth on the frontend, with JWT verification on the backend.

---

## 🗺️ Roadmap

- [ ] More problems (payment system, rate limiter, distributed message queue, news feed)
- [ ] Automated tests for agents, the graph parser and API routes
- [ ] Weighted diagram scoring (by how important a component is, not just whether it's present)
- [ ] Exportable PDF reports
- [ ] Peer / multiplayer mock interview mode
- [ ] Mobile-friendly whiteboard

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  Built with ❤️ | SystemIQ: Practice Smarter, Interview Better
</div>

## Run without any API keys

Use Node 24 and install both apps with `npm ci` in `backend/` and `frontend/`.
No `.env` files or service credentials are needed:

1. In `backend/`, run `npm run dev:mock` (port 5000).
2. In `frontend/`, run `npm run dev:mock` (port 5173).
3. Open http://localhost:5173/problems, pick a problem and start an interview.
   Send a few design answers, then "let's wrap up" to see the report.

The demo signs in as `demo-user`, using `mock-token-demo-user`. The backend uses
in-memory Redis, Supabase tables and a LangGraph MemorySaver. LLM responses,
scores and voice transcription are deterministic fixtures, not real AI assessment
or speech recognition. All demo data disappears when the backend restarts.

`MOCK_MODE=true` enables the backend fixtures; the backend refuses to boot when
both `MOCK_MODE=true` and `NODE_ENV=production`. Frontend mock auth is enabled
only by `VITE_MOCK_AUTH=true` (included in the explicit `--mode mock` launch).
Regular production builds use real auth; explicitly supplying that flag when
building produces a demo build. Never deploy demo builds as a real service.

Run `npm test` in each app; use `npm run test:watch` while working. CI runs lint,
syntax/type checks, tests and builds for both apps without credentials.
