<div align="center">

# 🧠 SystemIQ

### AI-Powered System Design Interview Simulator

*Practice system design interviews with a smart AI interviewer that listens, evaluates your architecture diagrams, and gives you real feedback.*

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF6B35?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

</div>

---

## 💡 What is SystemIQ?

SystemIQ is a full-stack web app that puts you in a **real-feeling system design interview** — driven by AI. You pick a problem, talk or type your way through the solution, draw your architecture on a live whiteboard, and get scored at every step.

Think of it as a mock interview panel in your browser, available 24/7.

**How a session works:**
1. **Choose a problem** — TinyURL, Instagram, Uber, Google Drive, Chat App, and more
2. **Interview begins** — an AI interviewer walks you through stages: Requirements → High-Level Design → Deep Dive → Wrap-up
3. **Draw your architecture** — drag-and-drop a live diagram with load balancers, caches, queues, databases, CDNs, and APIs
4. **AI checks everything** — your spoken answers are compared against your drawn diagram for consistency
5. **Get your report** — a full breakdown of strengths, weaknesses, concept coverage, and recommendations

---

## ⚙️ Tech Stack

### Backend — `/backend`
| Technology | Role |
|---|---|
| **Node.js** (ESM) + **Express 5** | API server |
| **LangGraph** (`@langchain/langgraph`) | Multi-agent state machine for the interview flow |
| **LangChain** + **OpenAI / Gemini / Groq** | LLM orchestration with multi-provider support |
| **Groq Whisper** (`whisper-large-v3-turbo`) | Real-time audio transcription for voice interviews |
| **Supabase** | Auth + Postgres (interview history, reports) |
| **Upstash Redis** | Fast session/state caching between agent steps |
| **Zod** | Structured output validation for agent responses |

### Frontend — `/frontend`
| Technology | Role |
|---|---|
| **React 19** + **TypeScript** + **Vite** | Core UI framework |
| **React Flow** | Interactive drag-and-drop architecture whiteboard |
| **Recharts** | Score trend analytics and charts |
| **Framer Motion** | Animations and transitions |
| **Tailwind CSS 3** | Styling |
| **react-resizable-panels** | Split-pane interview layout (chat + diagram) |
| **Supabase JS** | Client-side auth and session management |

---

## 🤖 How the AI Works

The interview is powered by a **LangGraph state machine** — a graph of AI agents that each do one job and pass control forward:

```
START → greeting → input → intent → orchestrator ──▶ evaluator ──▶ conversationManager
                                    └──────────────▶ conversationManager
                                                              ↓
                                                     interviewer / graphAnalyzer
```

| Agent Node | What it does |
|---|---|
| `greeting` | Welcomes the candidate and kicks off the session |
| `input` | Receives the candidate's latest message |
| `intent` | Classifies it: `ANSWER`, `QUESTION`, `CLARIFICATION`, `SMALL_TALK`, `WRAP_UP`, etc. |
| `orchestrator` | Routes to evaluator (for answers) or conversation manager (for everything else) |
| `evaluator` | Scores the answer against a per-problem rubric; tracks strengths, weaknesses, concept coverage |
| `conversationManager` | Decides tone, hint level, and what to focus on next |
| `interviewer` | Asks the next question based on current stage and objectives |
| `graphAnalyzer` | Compares the live whiteboard diagram against spoken concepts — flags mismatches |

Each agent has its own **prompt**, **Zod schema** for structured output, and **agent wrapper** — keeping prompt engineering, output contracts, and orchestration cleanly separated.

---

## 📂 Project Structure

```
SystemIQ/
├── backend/
│   ├── agent.js                    # LangGraph StateGraph — the core interview engine
│   ├── server.js                   # Express app entrypoint
│   └── src/
│       ├── agents/                 # conversation / evaluator / intent / interviewer
│       ├── nodes/                  # LangGraph node implementations
│       ├── config/                 # Redis (Upstash) & Supabase client setup
│       ├── controllers/            # Route handlers (interview, graph, transcribe, reports)
│       ├── knowledge/              # Per-problem JSON knowledge base
│       ├── middleware/auth.js      # Supabase auth guard
│       ├── models/                 # Interview session model & enums
│       ├── routes/                 # interview / history / problem / report / voice
│       ├── services/               # Session, graph, report, LLM, memory, transcriber
│       ├── sockets/                # Real-time interview messaging (WebSockets)
│       └── state.js                # Shared LangGraph State schema
│
└── frontend/
    └── src/
        ├── architecture/           # React Flow canvas, Inspector, Sidebar, node/edge types
        ├── nodes/                  # Diagram node components (API, CDN, Cache, DB, LB, Queue)
        ├── components/             # Landing, Dashboard, History, Report, Analytics, UI
        ├── pages/                  # Landing, Login, Signup, Dashboard, Interview, Report...
        ├── services/               # Axios-based API clients mirroring backend routes
        └── lib/supabase.ts         # Supabase client init
```

---

## 🔌 API Reference

All interview and history routes are protected by Supabase auth middleware.

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/interview/start` | Start a new session for a chosen problem & difficulty |
| `POST` | `/api/interview/initialize` | Initialize interview state and trigger greeting |
| `POST` | `/api/interview/message` | Send a candidate message through the agent graph |
| `POST` | `/api/interview/graph` | Save the current whiteboard diagram state |
| `POST` | `/api/interview/end` | End the session and trigger report generation |
| `GET` | `/api/interview/state/:interviewId` | Fetch current interview state |
| `GET` | `/api/problems` | List all available problems |
| `GET` | `/api/problems/:id` | Fetch a single problem |
| `GET` | `/api/history` | Get the user's interview history |
| `GET` | `/api/report/:interviewId` | Fetch the generated report |
| `POST` | `/api/voice/transcribe` | Upload audio and get back a transcription (Groq Whisper) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- A **Supabase** project (URL + service role key)
- An **Upstash Redis** database (REST URL + token)
- API keys for your LLM providers: **OpenAI**, **Gemini**, and/or **Groq**

---

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/SystemIQ.git
cd SystemIQ
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:

```env
PORT=5000

SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

UPSTASH_REDIS_REST_URL=your-upstash-redis-rest-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-rest-token

OPENAI_API_KEY=your-openai-api-key
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
```

```bash
npm run dev
# Runs on http://localhost:5000
```

### 3. Set up the Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## ✨ Features at a Glance

- 🎙️ **Voice or text input** — speak your answers; Groq Whisper handles transcription
- 🖼️ **Live architecture whiteboard** — React Flow canvas with drag-and-drop system design components
- 🔍 **Diagram consistency check** — flags concepts you said but did not draw (and vice versa)
- 📊 **Stage-based progression** — structured interview flow with clear objectives at every stage
- 🧠 **Adaptive AI interviewer** — adjusts tone, hints, and focus based on how you are doing
- 📋 **Detailed post-interview report** — stage-by-stage scores, strengths, weaknesses, recommendations
- 📈 **Progress dashboard** — track your improvement across sessions over time
- 🔐 **Auth-protected** — secure login via Supabase on both frontend and backend
- ⚡ **Redis-backed state** — fast, low-latency session management between agent steps

---

## 🗺️ Roadmap

- [ ] Add more problems (payment systems, rate limiters, distributed messaging, etc.)
- [ ] Peer / multiplayer mock interview mode
- [ ] Weighted diagram scoring (by architectural significance, not just presence)
- [ ] Exportable PDF interview reports
- [ ] Mobile-responsive whiteboard

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

<div align="center">
  Built with ❤️ | SystemIQ — Practice Smarter, Interview Better
</div>
