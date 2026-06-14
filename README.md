# BrandOPS

> An autonomous multi-agent AI engine for market entry strategy and campaign design.
> Transforms the CDSG × Food Empire consulting brief into a chain of validated JSON artifacts — each produced by a specialist LLM agent and streamed live to the UI.

---

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BrandOPS Pipeline                                   │
│                                                                               │
│  PDF Reports ──▶ IntelligenceAgent ──▶ StrategyAgent ──▶ MarketDebateAgent ──▶ CampaignAgent │
│                  (Section 1.A)         (Section 1.B)      (Section 1.C)        (Section 2)    │
│                  consolidated_timeline strategic_analysis  market_recommendation campaign_proposal │
└─────────────────────────────────────────────────────────────────────────────┘
```

Each agent receives the previous agent's validated JSON as its sole input. The Orchestrator (LangGraph state machine) manages the chain, persists artifacts to disk, and publishes real-time events over SSE. The frontend consumes those events and reveals each result card as it arrives.

---

## Monorepo Structure

```
BrandOPS/
├── backend/                   FastAPI + LangGraph agent engine (Python 3.12)
│   ├── app/
│   │   ├── main.py            API routes: /health /upload /run /run/{id}/stream /translate
│   │   ├── agents/
│   │   │   ├── base.py        BaseAgent — LLM call + JSON extraction + schema retry (max 2)
│   │   │   ├── intelligence.py IntelligenceAgent (3-pass PDF pipeline)
│   │   │   ├── strategy.py    StrategyAgent (3-pass: detect → analyse → synthesise)
│   │   │   ├── market.py      MarketDebateAgent (2-pass: debate → decide)
│   │   │   ├── campaign.py    CampaignAgent (2-pass: plan → operations)
│   │   │   ├── mock.py        MockAgent — returns frozen examples/ artifacts (no LLM needed)
│   │   │   ├── registry.py    Selects live vs mock agents based on LLM_API_KEY / USE_MOCK_AGENTS
│   │   │   └── prompts.py     All LLM system + user prompts (fully in English)
│   │   └── core/
│   │       ├── orchestrator.py LangGraph state machine — chains agents, writes artifacts, manages RUNS dict
│   │       ├── events.py      SSE publisher — one asyncio queue per run, 15s heartbeat
│   │       ├── validation.py  JSON schema validation layer (jsonschema)
│   │       ├── pdf.py         PDF → plain text (pypdf primary, pdfplumber fallback)
│   │       └── config.py      Environment config (BYOK, paths, mock mode)
│   ├── reports/               Food Empire annual report PDFs (uploaded via /upload)
│   ├── artifacts/             Run outputs written here (run_state.json + agent JSONs)
│   ├── tests/                 pytest — PDF reading, agent end-to-end, schema validation
│   └── requirements.txt
│
├── frontend/                  Next.js 14 (App Router) + Tailwind + Framer Motion
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── run/page.tsx   Pipeline launcher: PDF upload + live SSE progress
│   │   │   └── artifacts/
│   │   │       ├── intelligence/page.tsx  Intelligence timeline view
│   │   │       ├── strategy/page.tsx      Strategic analysis + period timeline
│   │   │       ├── market/page.tsx        Market recommendation + debate cards
│   │   │       └── campaign/page.tsx      Campaign plan + Gantt + budget + KPIs
│   │   ├── api/
│   │   │   ├── auth/          Login / logout route handlers (bcrypt + JWT)
│   │   │   ├── pipeline/      Proxy routes to backend + Turso artifact persistence
│   │   │   └── reports/       PDF upload/list/delete proxy
│   │   └── login/             Auth screen
│   ├── components/
│   │   ├── usePipeline.ts     SSE client hook — live run → polling fallback → demo fallback
│   │   ├── useArtifact.tsx    Artifact fetch hook (Turso DB → localStorage fallback)
│   │   ├── GanttChart.tsx     12-month Gantt rendered from campaign JSON
│   │   ├── BudgetChart.tsx    Budget breakdown chart
│   │   ├── PdfUpload.tsx      Drag-and-drop PDF uploader
│   │   └── Hero.tsx           Landing hero with live agent console animation
│   └── lib/
│       ├── db.ts              Turso/libSQL client + schema init + CRUD helpers
│       ├── api.ts             Frontend API layer (mock JSON → real backend)
│       ├── auth.ts            JWT session helpers (jose, Edge-compatible)
│       ├── session.ts         httpOnly cookie session (7-day TTL)
│       └── types.ts           TypeScript types mirroring JSON schemas
│
├── schemas/                   JSON Schema files (inter-agent data contracts)
│   ├── consolidated_timeline.schema.json
│   ├── strategic_analysis.schema.json
│   ├── market_recommendation.schema.json
│   ├── campaign_proposal.schema.json
│   └── run_state.schema.json
│
├── examples/                  Valid frozen artifacts (used by mock mode + frontend dev)
│   ├── consolidated_timeline.json
│   ├── strategic_analysis.json
│   ├── market_recommendation.json
│   └── campaign_proposal.json
│
└── docs/                      Architecture notes and decision records
```

---

## Agent Deep-Dive

### 1. IntelligenceAgent — `consolidated_timeline`

**Brief section:** 1.A  
**Input:** Food Empire annual report PDFs (uploaded to `backend/reports/`)  
**Output:** `consolidated_timeline.schema.json` — an array of per-year records

**Three-pass PDF pipeline:**
1. **Extract** — reads each PDF with `pypdf` (pdfplumber fallback), then sends the raw text to Claude with targeted questions about MD&A, segment reporting, financials, risk factors, and KPIs. Returns structured bullet points.
2. **Compress** — takes the extracted text and compresses it into a strict JSON record per year (`year`, `data_available`, `key_events`, `geographic_markets`, `stated_strategy`, `financials`, `risks`, `kpis`). Runs `gc.collect()` after each PDF to manage memory.
3. **Consolidate** — assembles all year records chronologically into the final `consolidated_timeline` artifact.

If a PDF is unreadable, a `data_available: false` fallback record is inserted so the pipeline never halts.

---

### 2. StrategyAgent — `strategic_analysis`

**Brief section:** 1.B  
**Input:** `consolidated_timeline` (IntelligenceAgent output)  
**Output:** `strategic_analysis.schema.json` — named strategic periods + synthesis narrative

**Three-pass approach:**
1. **Period detection** — identifies distinct strategic eras in Food Empire's history (e.g. "Post-COVID Expansion", "Russia Consolidation"), each with a name, start/end year, and transition rationale.
2. **Deep analysis per period** — for each detected period, runs an isolated analysis covering strategy, geography, financials, initiatives, brand evolution, and KPI movement.
3. **Synthesis** — produces a coherent multi-paragraph narrative that connects all periods into a single strategic story, followed by a structured summary of key financial and geographic trends.

---

### 3. MarketDebateAgent — `market_recommendation`

**Brief section:** 1.C  
**Input:** `strategic_analysis` (StrategyAgent output)  
**Output:** `market_recommendation.schema.json` — selected target market + full justification

**Two-pass debate structure:**
1. **Candidate markets** — generates 3–5 candidate markets for Food Empire's next expansion. For each candidate: bull case, bear case, entry mode options, and a CFO score (0–10) based on financial fit and risk.
2. **Decision** — selects the winning market with a final recommendation, critical success factors, risk mitigation plan, Food Empire-specific adaptations required, and the recommended entry mode.

The debate format ensures the recommendation is stress-tested before the final decision is locked.

---

### 4. CampaignAgent — `campaign_proposal`

**Brief section:** 2  
**Input:** `market_recommendation` (MarketDebateAgent output)  
**Output:** `campaign_proposal.schema.json` — full go-to-market campaign plan

**Two-pass operations split:**
1. **Plan** — target audience definition, value proposition, positioning statement, core message, and the full marketing mix (Product, Price, Place, Promotion).
2. **Operations** — justified budget with line items (budget reconciliation enforced: `sum(line_items) == total`), 12-month Gantt chart, and KPI measurement plan.

---

## Data Flow

```
User uploads PDFs
      │
      ▼
POST /run  ──────────────────────────────────────────────────────────┐
      │                                                               │
      │  Backend (Railway)                                            │
      │  ┌─────────────────────────────────────────────────────┐    │
      │  │  Orchestrator (LangGraph)                            │    │
      │  │  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌────────┐│    │
      │  │  │Intel-   │→ │Strategy  │→ │Market  │→ │Campaign││    │
      │  │  │ligence  │  │Agent     │  │Debate  │  │Agent   ││    │
      │  │  │Agent    │  │          │  │Agent   │  │        ││    │
      │  │  └────┬────┘  └────┬─────┘  └────┬───┘  └────┬───┘│    │
      │  │       │            │              │            │    │    │
      │  │  publish(stage_started / stage_completed / run_finished)  │
      │  └────────────────────┼──────────────────────────────────┘   │
      │                       │ SSE stream                           │
      ▼                       ▼                                      │
GET /run/{id}/stream  ──▶  Frontend (usePipeline hook)              │
                            │                                         │
                            ├── reveals each artifact card on arrival │
                            │                                         │
                            └── saves artifact to Turso DB (via      │
                                Next.js API route → /api/pipeline/artifact) │
```

---

## API Endpoints (Backend — FastAPI)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check; returns `mock_agents` flag |
| `GET` | `/reports` | List uploaded PDF files |
| `POST` | `/upload` | Upload a Food Empire annual report PDF |
| `DELETE` | `/reports/{filename}` | Delete an uploaded PDF |
| `POST` | `/run` | Start a new pipeline run; returns `run_id` |
| `GET` | `/run/{run_id}` | Get run state (status, stages, artifacts) |
| `GET` | `/run/{run_id}/stream` | SSE stream — `stage_started`, `stage_completed`, `run_finished` events |
| `POST` | `/translate` | Translate an artifact payload to English (used by migration route) |

---

## SSE Event Schema

The frontend connects to `/run/{run_id}/stream` and receives:

```json
{ "event": "stage_started",    "data": { "agent": "intelligence", "started_at": "..." } }
{ "event": "stage_completed",  "data": { "agent": "intelligence", "artifact": { ... }, "attempts": 1 } }
{ "event": "run_finished",     "data": { "status": "completed", "run_id": "..." } }
```

A `ping` heartbeat (SSE comment line) is sent every 15 seconds to keep proxies from closing idle connections during long agent stages.

If the SSE connection drops (e.g. Railway proxy timeout during a multi-minute IntelligenceAgent pass), `usePipeline` automatically switches to polling `GET /run/{run_id}` every 5 seconds until the run finishes, then fetches artifacts from Turso.

---

## Storage

| Layer | What is stored | Technology |
|-------|---------------|------------|
| Backend disk | `run_state.json` + raw artifact JSON per run | Railway ephemeral filesystem |
| Turso (libSQL) | `pipeline_runs` + `pipeline_artifacts` (JSON payload column) | Turso remote SQLite |
| Browser | Artifact cache for offline/demo viewing | `localStorage` (`bo_artifact_*`) |

The Turso DB is the canonical store. Backend disk is a write-through cache; it is wiped on Railway deploys.

---

## Mock Mode

When `LLM_API_KEY` is absent or `USE_MOCK_AGENTS=true`, the registry swaps all live agents for `MockAgent`, which:
- Reads the frozen, schema-valid artifacts from `examples/`
- Sleeps 1.5 seconds per stage to simulate a realistic live stream

This lets the full UI flow work end-to-end without any API key.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_API_KEY` | — | Anthropic API key (BYOK). Omit to use mock mode. |
| `MODEL_NAME` | `claude-opus-4-8` | Anthropic model ID |
| `LLM_MAX_TOKENS` | `8192` | Max tokens per LLM call |
| `INTEL_EXTRACT_MAX_TOKENS` | `LLM_MAX_TOKENS` | Override for IntelligenceAgent extract pass |
| `INTEL_COMPRESS_MAX_TOKENS` | `LLM_MAX_TOKENS` | Override for IntelligenceAgent compress pass |
| `LLM_MAX_ATTEMPTS` | `1` | Schema-retry attempts on validation failure |
| `REPORT_TEXT_MAX_CHARS` | `40000` | PDF text truncation limit (per report) |
| `USE_MOCK_AGENTS` | `auto` | `true` / `false` / `auto` (auto = mock when no key) |
| `BACKEND_URL` | `http://localhost:8000` | Backend base URL (used by frontend) |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend origin (CORS) |
| `DATABASE_URL` | `file:local.db` | Turso libSQL URL (`libsql://...turso.io` in production) |
| `DATABASE_AUTH_TOKEN` | — | Turso auth token (production only) |
| `AUTH_SECRET` | insecure default | JWT signing secret — **must be set in production** |

---

## Local Development

```bash
# 1. Clone and set up environment
cp .env.example .env
# Fill in LLM_API_KEY (optional — omit to use mock mode)

# 2. Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
npm run dev

# 4. Open http://localhost:3000
#    Login: demo@brandops.ai / demo1234
```

---

## Running Tests

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```

Tests cover:
- PDF text extraction on a real PDF
- IntelligenceAgent end-to-end with a fake LLM (3 synthetic years, schema validation)
- Inaccessible year fallback record
- No-reports `FileNotFoundError` guard

---

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Backend | Railway | FastAPI on port 8000; `reports/` disk is ephemeral |
| Frontend | Vercel | Next.js App Router; env vars set in Vercel dashboard |
| Database | Turso | Remote libSQL; `DATABASE_URL` + `DATABASE_AUTH_TOKEN` in Vercel env |

See [`DEPLOY.md`](./DEPLOY.md) for full deployment instructions.

---

## Brief Coverage — 13 Required Deliverables

| # | Requirement | Agent | Route |
|---|-------------|-------|-------|
| 1 | Compressed chronological summaries of annual reports | IntelligenceAgent | `/artifacts/intelligence` |
| 2 | Named strategic period timeline with transitions | StrategyAgent — Pass 1 | `/artifacts/strategy` |
| 3 | Deep per-period analysis | StrategyAgent — Pass 2 | `/artifacts/strategy` |
| 4 | Synthesised coherent narrative | StrategyAgent — Pass 3 | `/artifacts/strategy` |
| 5 | Target market recommendation + rationale | MarketDebateAgent | `/artifacts/market` |
| 6 | Critical success factors | MarketDebateAgent | `/artifacts/market` |
| 7 | Risk analysis + mitigation plan | MarketDebateAgent | `/artifacts/market` |
| 8 | Entry mode recommendation | MarketDebateAgent | `/artifacts/market` |
| 9 | Target audience definition | CampaignAgent — Pass 1 | `/artifacts/campaign` |
| 10 | Value proposition + positioning | CampaignAgent — Pass 1 | `/artifacts/campaign` |
| 11 | Marketing mix (4Ps) | CampaignAgent — Pass 1 | `/artifacts/campaign` |
| 12 | Justified budget + 12-month Gantt | CampaignAgent — Pass 2 | `/artifacts/campaign` |
| 13 | KPIs + measurement plan | CampaignAgent — Pass 2 | `/artifacts/campaign` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Auth | JWT (jose) + bcrypt + httpOnly cookie |
| Backend framework | FastAPI |
| Agent orchestration | LangGraph |
| LLM | Anthropic Claude (BYOK) |
| Schema validation | jsonschema (Python) |
| PDF extraction | pypdf + pdfplumber |
| Database | Turso (libSQL / remote SQLite) |
| Realtime | Server-Sent Events (SSE) |
| Deployment | Vercel (frontend) + Railway (backend) |
