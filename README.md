# 🧠 SystemIQ

An AI-powered system design mock interviewer. SystemIQ pairs you with a multi-agent LLM "interviewer" that asks questions, evaluates your answers in real time, watches the architecture diagram you draw, and generates a detailed performance report at the end — like practicing a system design round with an interview panel that never gets tired.

---

## 📖 Overview

SystemIQ simulates a real system design interview end-to-end:

1. Pick a problem (e.g. *Design TinyURL*, *Design Instagram*, *Design Uber*) and a difficulty level.
2. Talk or type through requirements, high-level design, and deep dives while an **interviewer agent** drives the conversation stage by stage (Requirements → High-Level Design → Deep Dive → Wrap-up).
3. Draw your architecture live on a **React Flow** whiteboard (load balancers, caches, queues, DBs, CDNs...) — the backend cross-checks what you *say* against what you *draw*.
4. An **evaluator agent** scores each answer against a per-problem rubric, tracks strengths/weaknesses and concept coverage.
5. At the end, a **report generator** produces a stage-by-stage breakdown, strengths/weaknesses, and recommendations, all viewable on a dashboard with history and progress tracking.

---

## 🏗️ Tech Stack

### Backend (`/backend`)
- **Node.js** (ESM) + **Express 5**
- **LangGraph** (`@langchain/langgraph`) — orchestrates the interview as a stateful agent graph
- **LangChain** (`langchain`, `@langchain/core`, `@langchain/openai`) — LLM orchestration layer
- **Multi-LLM support**: OpenAI SDK, Google Gemini (`@google/genai`, `@google/generative-ai`), Groq SDK
- **Groq Whisper (`whisper-large-v3-turbo`)** — audio transcription for voice-based interviews
- **Supabase** (`@supabase/supabase-js`) — auth, Postgres persistence (interview history, reports)
- **Upstash Redis** (`@upstash/redis`) + **ioredis** — session/state caching
- **Zod** — schema validation for structured agent outputs

### Frontend (`/frontend`)
- **React 19** + **TypeScript** + **Vite 8**
- **React Flow (`reactflow`)** — interactive drag-and-drop system design canvas (API, CDN, Cache, DB, Load Balancer, Queue nodes)
- **Recharts** — analytics/score-trend charts
- **Framer Motion** — animations (landing page effects, reveals, floating particles)
- **Tailwind CSS 3** — styling
- **react-resizable-panels** — resizable interview layout (chat + diagram panels)
- **Supabase JS client** — auth session on the client
- Deployed on **Vercel** (`vercel.json` SPA rewrite config)

---

## 🤖 Agent Architecture

The core of SystemIQ is a **LangGraph state machine** (`backend/agent.js`) wiring together eight nodes around a shared, strongly-typed `State` object (`backend/src/state.js`):

```
START → greeting → input → intent → orchestrator ──▶ evaluator ──▶ conversationManager
                                    └──────────────▶ conversationManager
                                                              ↓
                                                         interviewer / graphAnalyzer
```

| Node | Responsibility |
|---|---|
| **greeting** | Kicks off the interview / welcomes the candidate |
| **input** | Ingests the candidate's latest message |
| **intent** | Classifies the message: `ANSWER`, `QUESTION`, `CLARIFICATION`, `SMALL_TALK`, `WRAP_UP`, `ACKNOWLEDGEMENT`, `UNKNOWN` |
| **orchestrator** | Routes based on intent — answers go to the evaluator, everything else to the conversation manager |
| **evaluator** | Grades the candidate's answer against the problem's rubric; updates strengths, weaknesses, covered concepts |
| **conversationManager** | Decides tone, hint level, whether to acknowledge, and what topic/concept to steer toward next |
| **interviewer** | Asks the next interview question based on current stage & objective |
| **graphAnalyzer** | Compares the whiteboard diagram (nodes/edges drawn by the candidate) against what was verbally mentioned, to check architecture-diagram consistency |

Shared `State` tracks: conversation messages, interview stage/progress/difficulty, candidate evaluation (strengths, weaknesses, covered concepts, architecture choices, assumptions), conversation-manager decisions, rolling memory/summary, and the live whiteboard graph + its consistency analysis against spoken concepts.

Each agent (`src/agents/{conversation,evaluator,intent,interviewer}`) has its own **prompt**, **schema** (Zod-validated structured output), and **agent** wrapper — a clean separation between prompt engineering, output contracts, and orchestration logic.

---

## 📚 Knowledge Base

Interview content is data-driven, not hardcoded. `backend/src/knowledge/` ships structured JSON per problem:

- `problem.json` — title, difficulty, functional/non-functional requirements, constraints
- `interview.json` — stage objectives & completion criteria
- `evaluation.json` — rubric used by the evaluator agent
- `architecture.json` — reference/expected architecture
- `graph.json` — expected whiteboard graph shape, used for diagram-consistency checks

Problems currently included: **URL Shortener (TinyURL)**, **Instagram**, **Uber**, **Google Drive**, **Chat App**. New problems can be added by dropping in a new folder with the same five files — `knowledgeLoader.js` loads them dynamically.

---

## ✨ Features

- 🗣️ **Text or voice interviews** — speak your answers; Groq Whisper transcribes them in real time
- 🧩 **Live architecture whiteboard** — drag-and-drop system design nodes (LB, cache, queue, DB, CDN, API) on a React Flow canvas
- 🔍 **Diagram-to-speech consistency checking** — flags concepts you mentioned but didn't draw (or vice versa)
- 📊 **Stage-based progression** — Requirements → High-Level Design → Deep Dive → Wrap-up, each with its own objective & completion criteria
- 🧠 **Adaptive conversation manager** — controls tone, hint level, and follow-up direction based on how the interview is going
- 📈 **Post-interview report** — hero summary, stage breakdown, strengths/weaknesses, recommendations
- 🗂️ **Interview history & progress dashboard** — score trends over time, recent interviews, popular problems
- 🔐 **Supabase auth** — protected routes on both frontend and backend
- ⚡ **Redis-backed session state** (Upstash) for fast, ephemeral interview state

---

## 📂 Project Structure

```
SystemIQ/
├── backend/
│   ├── agent.js                    # LangGraph StateGraph wiring (the core agent)
│   ├── server.js                   # Express app entrypoint
│   └── src/
│       ├── agents/                 # conversation / evaluator / intent / interviewer
│       │   └── <agent>/{agent,prompt,schema}.js
│       ├── nodes/                  # LangGraph node implementations
│       ├── config/                 # Redis (Upstash) & Supabase clients
│       ├── controllers/            # Route handlers (interview, graph, transcribe, reports...)
│       ├── knowledge/              # Per-problem JSON knowledge base
│       ├── middleware/auth.js      # Auth guard
│       ├── models/                 # Interview session model & enums
│       ├── routes/                 # interview / history / problem / report / voice
│       ├── services/
│       │   ├── interview/          # session, persistence, interview orchestration
│       │   ├── graph/              # whiteboard graph service + context builder
│       │   ├── report/             # report generation
│       │   ├── transcriber.js      # Groq Whisper wrapper
│       │   ├── llm.js              # LLM client(s)
│       │   └── memory.js           # rolling interview memory/summary
│       ├── sockets/                # real-time interview messaging
│       └── state.js                # shared LangGraph State schema
└── frontend/
    └── src/
        ├── architecture/           # React Flow canvas: Flow, Inspector, Sidebar, node/edge types
        ├── nodes/                  # Diagram node components (Api, CDN, Cache, Db, Lb, Queue)
        ├── components/
        │   ├── landing/            # Marketing/landing page sections
        │   ├── dashboard/          # Dashboard widgets
        │   ├── history/            # Interview history table & stats
        │   ├── report/             # Report page sections
        │   ├── analytics/          # Score trend charts
        │   └── ui/                 # Buttons, cards, inputs, badges
        ├── pages/                  # Landing, Login, Signup, Dashboard, Interview, ProblemPage, ReportPage...
        ├── services/                # Axios-based API clients mirroring backend routes
        └── lib/supabase.ts          # Supabase client
```

---

## 🔌 API Overview

| Route | Description |
|---|---|
| `POST /api/interview/start` | Start a new interview session for a chosen problem & difficulty |
| `POST /api/interview/initialize` | Initialize interview state/greeting |
| `POST /api/interview/message` | Send a candidate message through the agent graph |
| `POST /api/interview/graph` | Save the candidate's whiteboard diagram state |
| `POST /api/interview/end` | End the interview & trigger report generation |
| `GET  /api/interview/state/:interviewId` | Fetch current interview state |
| `GET  /api/problems` / `GET /api/problems/:id` | List problems / fetch a single problem |
| `GET  /api/history` | Get the authenticated user's interview history (Supabase) |
| `GET  /api/report/:interviewId` | Fetch the generated report for an interview |
| `POST /api/voice/transcribe` | Upload audio, get back a transcription (Groq Whisper) |

All interview/history routes are protected by an auth middleware backed by Supabase.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (URL + service role key)
- An Upstash Redis database (REST URL + token)
- API keys for whichever LLM providers you use (OpenAI / Gemini / Groq)

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
OPENAI_API_KEY=your-openai-key
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key
```

```bash
npm run dev
```

Runs on `http://localhost:5000` (via `nodemon server.js`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on Vite's default dev server (`http://localhost:5173`), CORS-whitelisted by the backend alongside the production deployment at `system-iq.vercel.app`.

---

## 🧭 Roadmap Ideas

- Add more problems to the knowledge base (payments systems, ride-matching internals, distributed rate limiters, etc.)
- Multiplayer / peer mock-interview mode
- Richer graph-consistency scoring (weighted by architectural significance, not just presence/absence)

---
