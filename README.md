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
3. **Draw your architecture.** Drag clients, load balancers, services, caches, queues, databases, storage, search and CDNs onto a React Flow canvas and connect them.
4. **The AI cross-checks you.** Every answer is scored against a per-problem rubric, and your diagram is compared with what you said. It flags components you mentioned but didn't draw, and the reverse.
5. **Get your report.** You see an overall score, a breakdown by stage, your strengths and weaknesses, and recommendations. Reports are saved to your history so you can track progress.

---

## ⚙️ Tech Stack

### Backend: `/backend`
| Technology | Role |
|---|---|
| **Node.js** (ESM) + **Express 5** | REST API server |
| **LangGraph** (`@langchain/langgraph`) | Multi-agent state machine that runs the interview |
| **LangChain** + **OpenRouter** | LLM calls through an OpenAI-compatible API (any OpenRouter model, default `gpt-4o-mini`) |
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
| **React Flow** | Drag-and-drop architecture whiteboard |
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
        ├── architecture/           # React Flow canvas, inspector, sidebar, node and edge types
        ├── nodes/                  # Diagram node components (Client, Service, Cache, DB, Queue, ...)
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

### 3. Set up the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000

# Frontend origins allowed to call the API (comma-separated)
CORS_ORIGINS=http://localhost:5173

# Supabase (auth + persistence)
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Postgres connection string for the LangGraph checkpointer
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/postgres

# Upstash Redis (live session state)
UPSTASH_REDIS_REST_URL=https://<db>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>

# LLM via OpenRouter
OPENROUTER_API_KEY=<openrouter-key>
OPENROUTER_MODEL=gpt-4o-mini                       # optional, any OpenRouter model id
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1   # optional

# Voice transcription (Groq Whisper)
GROQ_API_KEY=<groq-key>
```

Start the server:

```bash
npm run dev
```

It runs on `http://localhost:5000`. The server won't start if `OPENROUTER_API_KEY` or `DATABASE_URL` is missing.

### 4. Set up the frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_API_URL=http://localhost:5000   # optional, this is the default
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
- **Backend:** runs on any Node host that supports long-running processes, such as Render, Railway or Fly.io. Set the backend environment variables listed above, including `CORS_ORIGINS` with your frontend's URL.

---

## ✨ Features at a Glance

- 🎙️ **Voice or text input.** Record your answer in the browser and Groq Whisper transcribes it.
- 🔊 **Spoken replies.** The interviewer's questions can be read aloud with the Web Speech API.
- 🖼️ **Live architecture whiteboard.** A React Flow canvas with typed system-design components and labeled edges.
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
