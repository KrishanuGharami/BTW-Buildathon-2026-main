from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from checkpoint_parser import parse_checkpoint
from drift_analyzer import analyze_checkpoint


app = FastAPI(
    title="IntentLock Core Engine",
    version="1.0.0",
    description="Checkpoint-aware AI coding regression detector",
)


# ============================================================
# CORS
# ============================================================

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


# ============================================================
# Request Model
# ============================================================

class CheckpointRequest(BaseModel):
    checkpoint_id: str
    developer_intent: str
    assumptions_made: str = ""
    unresolved_risks: str = ""
    agent_code_snapshot: str
    modified_files: List[str] = []


# ============================================================
# Health
# ============================================================

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "IntentLock Core Engine",
    }


# ============================================================
# Audit Checkpoint
# ============================================================

@app.post("/api/audit-checkpoint")
async def audit_checkpoint(payload: CheckpointRequest):

    try:

        context = parse_checkpoint(
            payload.model_dump()
        )

        result = analyze_checkpoint(context)

        return result

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# ============================================================
# Demo Endpoint
# ============================================================

@app.get("/api/demo")
async def demo():

    demo_payload = {
        "checkpoint_id": "checkpoint-demo-001",

        "developer_intent": (
            "Add checkpoint visualization without modifying "
            "authentication or security configuration."
        ),

        "assumptions_made": (
            "The existing authentication flow should remain unchanged."
        ),

        "unresolved_risks": (
            "Session hook security parameters must be reviewed "
            "before the checkpoint is accepted."
        ),

        "agent_code_snapshot": """
        Added the checkpoint visualization dashboard.

        Updated authentication middleware to support the new
        session flow.

        TODO: review session security parameters.
        """,

        "modified_files": [
            "frontend/components/intent-comparison.tsx",
            "frontend/app/page.tsx",
            "backend/main.py",
        ],
    }

    context = parse_checkpoint(demo_payload)

    return analyze_checkpoint(context)


# ============================================================
# Root
# ============================================================

@app.get("/")
async def root():

    return {
        "message": "IntentLock Core Engine is running.",
        "docs": "/docs",
    }