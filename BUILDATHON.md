# IntentLock — Buildathon Implementation Guide

## Project Overview

**IntentLock** is a checkpoint-aware regression detection layer for AI-assisted software development.

It is designed to work with the **Entire CLI** by preserving historical developer intent and comparing that intent against the current AI-generated implementation.

> **Git tells you what changed. IntentLock tells you whether the AI broke your intent.**

## Core Goal

For the buildathon, the MVP should demonstrate this complete flow:

```text
Entire CLI checkpoint/context
        ↓
IntentLock checkpoint adapter/parser
        ↓
Intent drift analyzer
        ↓
FastAPI API
        ↓
Next.js dashboard
        ↓
Human Intent vs AI Implementation
```

The dashboard should show original developer intent, assumptions, unresolved risks, current AI-generated implementation, detected mismatches, severity, drift score, affected files, and an audit summary.

## Final Repository Structure

Keep the original Entire CLI code intact and isolate IntentLock inside its own folder.

```text
entire-cli/
│
├── [existing Entire CLI source files]
├── [existing Entire CLI folders]
├── ...
│
└── intentlock/
    │
    ├── backend/
    │   ├── main.py
    │   ├── checkpoint_parser.py
    │   ├── drift_analyzer.py
    │   ├── entire_adapter.py
    │   ├── requirements.txt
    │   └── .env
    │
    └── frontend/
        ├── app/
        │   ├── page.tsx
        │   ├── layout.tsx
        │   └── globals.css
        │
        ├── components/
        │   ├── intent-comparison.tsx
        │   └── ui/
        │       └── [shadcn generated components]
        │
        ├── lib/
        │   └── utils.ts
        │
        ├── .env.local
        ├── package.json
        └── tsconfig.json
```

## Important Rule: Do Not Break Entire CLI

Do **not** rewrite or heavily modify the original Entire CLI implementation.

IntentLock should behave as an integration layer:

```text
Entire CLI
   ↓
checkpoint/context output
   ↓
IntentLock adapter
```

Only add a small hook into Entire CLI core code if the real checkpoint implementation requires it.

## Backend Responsibilities

### `main.py`

FastAPI entry point.

Required endpoints:

```text
GET  /api/health
GET  /api/demo
POST /api/audit-checkpoint
```

Responsibilities:
- Receive checkpoint audit requests
- Pass data to `checkpoint_parser.py`
- Run `drift_analyzer.py`
- Return structured JSON
- Bridge Next.js and the IntentLock engine

### `checkpoint_parser.py`

Normalize checkpoint/context data into:

```text
checkpoint_id
developer_intent
assumptions_made
unresolved_risks
agent_code_snapshot
modified_files
```

The parser should support aliases such as:

```text
developer_intent / intent / objective / developerIntent
assumptions_made / assumptions / developer_assumptions
unresolved_risks / risks / unresolvedRisks
agent_code_snapshot / current_implementation / code / diff / agent_code
modified_files / affected_files / files
```

The parser should **not** decide whether a regression exists.

### `drift_analyzer.py`

This is the core IntentLock logic.

Responsibilities:
- Compare checkpoint intent with current implementation
- Detect scope violations
- Detect security/authentication changes that contradict assumptions
- Detect unresolved risks
- Detect unfinished/TODO implementation
- Produce structured violations
- Calculate drift score
- Calculate severity
- Return an audit summary

The backend analysis is authoritative. The frontend only visualizes results.

### `entire_adapter.py`

This is the bridge between Entire CLI and IntentLock.

Do **not** assume Entire stores checkpoints as JSON until the actual repository confirms it.

The adapter should eventually perform:

```text
Entire checkpoint/context
        ↓
load actual checkpoint representation
        ↓
map fields into IntentLock schema
        ↓
checkpoint_parser.py
        ↓
drift_analyzer.py
```

Conceptual API:

```python
def load_entire_checkpoint(...):
    ...


def convert_entire_checkpoint(...):
    ...


def audit_entire_checkpoint(...):
    ...
```

The exact implementation must follow the actual Entire CLI checkpoint storage/API discovered in the fork.

## Stable Backend Response Schema

Frontend and backend should use one stable contract:

```json
{
  "checkpoint_id": "checkpoint-001",
  "regression_detected": true,
  "risk_level": "HIGH",
  "severity": "HIGH REGRESSION",
  "drift_score": 78,
  "developer_intent": "Add checkpoint visualization without modifying authentication.",
  "assumptions_made": "Authentication flow must remain unchanged.",
  "unresolved_risks": "Session security parameters require review.",
  "current_implementation": "Updated authentication middleware and added dashboard.",
  "modified_files": [
    "frontend/app/page.tsx",
    "backend/main.py"
  ],
  "affected_files": [
    "frontend/app/page.tsx",
    "backend/main.py"
  ],
  "unfinished_requirements": [
    "Review session security parameters."
  ],
  "detected_violations": [
    {
      "field": "assumptions",
      "severity": "critical",
      "message": "Authentication-sensitive behavior changed even though the checkpoint required it to remain unchanged."
    }
  ],
  "report_summary": "IntentLock detected a mismatch between the historical developer checkpoint and the active AI-generated implementation."
}
```

Do not change this contract in one layer without updating the other.

## Frontend Responsibilities

Technology:
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-react

The frontend should:
- Fetch audit data from FastAPI
- Show loading and connection-error states
- Render drift score
- Render mismatch count
- Render risk/severity
- Render affected files
- Render human intent vs AI implementation
- Highlight mismatched fields
- Show violation explanations

The frontend should **not** implement regression detection logic.

## Frontend → Backend Connection

Create:

```text
intentlock/frontend/.env.local
```

Contents:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Frontend request:

```ts
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

const response = await fetch(`${API_URL}/api/demo`, {
  cache: "no-store",
});
```

During final integration, replace the demo-only flow with the real audit endpoint or a checkpoint-selection flow.

## Local Development Commands

### Backend

From:

```text
intentlock/backend
```

Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

Health:

```text
http://127.0.0.1:8000/api/health
```

Demo:

```text
http://127.0.0.1:8000/api/demo
```

### Frontend

From:

```text
intentlock/frontend
```

Run:

```bash
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

## Required Frontend Dependencies

```bash
npm install lucide-react
npx shadcn@latest init
npx shadcn@latest add badge button card progress separator collapsible
```

## Required Backend Dependencies

`requirements.txt`:

```txt
fastapi
uvicorn[standard]
pydantic
python-dotenv
```

Add more dependencies only when required by the final Entire CLI adapter or AI analysis layer.

## CORS

FastAPI should allow the local Next.js development origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Buildathon Milestones

### Milestone 1 — Frontend/Backend Demo

Must work first:

```text
GET /api/demo
      ↓
FastAPI analyzer
      ↓
JSON response
      ↓
Next.js
      ↓
IntentLock dashboard
```

Success condition:
- `http://127.0.0.1:8000/api/demo` returns JSON
- `http://localhost:3000` renders the dashboard
- Regression warning is visible
- Drift score is visible

### Milestone 2 — Real Audit Request

Test:

```text
POST /api/audit-checkpoint
```

Example body:

```json
{
  "checkpoint_id": "cp-001",
  "developer_intent": "Add a visualization without modifying authentication.",
  "assumptions_made": "Authentication flow must remain unchanged.",
  "unresolved_risks": "Session security parameters require review.",
  "agent_code_snapshot": "Updated authentication middleware. TODO: review session parameters.",
  "modified_files": [
    "frontend/app/page.tsx",
    "backend/auth.py"
  ]
}
```

Expected:
- `regression_detected = true`
- non-zero drift score
- violation explanation
- affected files
- summary

### Milestone 3 — Entire CLI Integration

Search the Entire CLI repository for:

```text
checkpoint
session
context
snapshot
metadata
git
```

Identify:
1. Where checkpoints are created
2. Where checkpoints are stored
3. What fields are available
4. How a checkpoint is loaded
5. Whether checkpoint data is file-based, Git-based, database-based, or internal CLI state
6. Whether a stable command/API exists to retrieve it

Then implement `entire_adapter.py` against the **actual** Entire CLI behavior.

Do not invent an API.

## Entire Adapter Design

Once the real checkpoint schema is known, convert it into:

```python
{
    "checkpoint_id": "...",
    "developer_intent": "...",
    "assumptions_made": "...",
    "unresolved_risks": "...",
    "agent_code_snapshot": "...",
    "modified_files": [...]
}
```

Then:

```python
context = parse_checkpoint(normalized_checkpoint)
result = analyze_checkpoint(context)
```

This keeps IntentLock independent from Entire's internal schema.

## Demo Scenario

### Historical checkpoint

```text
Developer Intent:
Add checkpoint visualization without modifying authentication or security configuration.

Assumption:
The existing authentication flow must remain unchanged.

Unresolved Risk:
Session hook security parameters must be reviewed before acceptance.
```

### AI-generated implementation

```text
Added checkpoint visualization.

Updated authentication middleware to support a new session flow.

TODO: review session security parameters.
```

### Expected IntentLock result

```text
REGRESSION DETECTED

Risk: CRITICAL/HIGH
Drift Score: high

Violation:
Authentication-sensitive behavior was modified despite the checkpoint assumption.

Unfinished Requirement:
Session security review remains unresolved.
```

## Judge Demo Flow

1. Show the original developer checkpoint.
2. Show the AI-generated change.
3. Show a normal Git diff briefly.
4. Explain that Git shows code changes, not intent violations.
5. Run the IntentLock audit.
6. Open the dashboard.
7. Show side-by-side Human Intent vs AI Implementation.
8. Point to detected violations.
9. Point to drift score and affected files.
10. Explain that IntentLock protects developer intent across agentic coding sessions.

Keep the demo short and deterministic.

## Product Positioning

> **IntentLock is an intent-aware regression firewall for AI coding agents. It uses historical checkpoint context to detect when an AI-generated implementation technically works but violates the developer's original assumptions, scope, unresolved risks, or architectural intent.**

Short version:

> **Git tells you what changed. IntentLock tells you whether the AI broke your intent.**

## Reliability Rules

- Keep `/api/demo` available as a fallback
- Do not depend entirely on an external API for the live demo
- Ensure deterministic local drift detection works
- Keep frontend and backend running in separate terminals
- Test the demo before presenting
- Avoid modifying Entire CLI core unless necessary
- Do not expose secrets in frontend code
- Do not commit `.env` files containing API keys
- Keep error states visible and understandable
- Prefer a working MVP over unfinished extra features

## Copilot Instructions

Copilot may:
- Refactor IntentLock code
- Improve TypeScript types
- Improve FastAPI validation
- Improve UI responsiveness
- Add tests
- Add error handling
- Add an adapter after the Entire checkpoint schema is verified

Copilot must not:
- Invent Entire CLI functions that do not exist
- Invent checkpoint file paths
- Replace the stable API response schema without updating both frontend and backend
- Move regression detection into the frontend
- Hardcode secret keys
- Delete original Entire CLI functionality
- Overwrite core Entire CLI files without an explicit reason
- Remove deterministic demo fallback behavior before final judging

## Definition of Done

The MVP is complete when:
- Entire CLI source remains operational
- IntentLock frontend runs on port `3000`
- IntentLock backend runs on port `8000`
- `/api/health` works
- `/api/demo` works
- `/api/audit-checkpoint` works
- Dashboard renders backend results
- Human intent and AI implementation are compared side-by-side
- Violations are highlighted
- Drift score is displayed
- Severity is displayed
- Affected files are displayed
- Real Entire checkpoint/context can be passed through the IntentLock adapter
- Demo can complete without external service failure

## Final Architecture

```text
┌───────────────────────────────┐
│          Entire CLI           │
│ Checkpoint / historical       │
│ developer context             │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│       entire_adapter.py       │
│ Convert Entire checkpoint     │
│ into IntentLock schema        │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│    checkpoint_parser.py       │
│ Normalize context             │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│      drift_analyzer.py        │
│ Intent-vs-code comparison     │
│ Regression detection          │
│ Drift scoring                 │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│            FastAPI            │
│ /api/audit-checkpoint         │
│ /api/demo                     │
│ /api/health                   │
└───────────────┬───────────────┘
                │ JSON
                ▼
┌───────────────────────────────┐
│        Next.js 14 UI          │
│ Human Intent vs               │
│ AI Implementation             │
│ Drift / Severity / Files      │
└───────────────────────────────┘
```

## Buildathon Priority

```text
1. Working backend
2. Working frontend
3. Frontend ↔ backend connection
4. Deterministic audit demo
5. Real Entire CLI checkpoint adapter
6. UI polish
7. Optional AI-assisted semantic analysis
8. Extra features
```

Do not sacrifice the working end-to-end demo for optional features.

---

**Project:** IntentLock  
**Category:** AI Developer Tooling / Agent Safety / Regression Detection  
**Core Integration:** Entire CLI checkpoint context  
**Frontend:** Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui  
**Backend:** FastAPI + Python  
**Primary Value Proposition:** Preserve developer intent across AI-assisted coding sessions.
