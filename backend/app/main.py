"""BrandOPS backend — FastAPI app: /health, /upload, /run, /run/{run_id}/stream (SSE)."""
import asyncio
import json
import re
import shutil
from typing import Any

import anthropic
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .core import events
from .core.config import ARTIFACTS_DIR, FRONTEND_URL, LLM_API_KEY, MODEL_NAME, REPORTS_DIR, USE_MOCK_AGENTS
from .core.orchestrator import RUNS, execute_run, new_run

app = FastAPI(title="BrandOPS Engine", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "mock_agents": USE_MOCK_AGENTS}


@app.get("/reports")
def list_reports():
    """Lists uploaded PDF files."""
    files = sorted(REPORTS_DIR.glob("*.pdf"))
    return {"reports": [f.name for f in files], "count": len(files)}


@app.post("/upload")
async def upload_report(file: UploadFile = File(...)):
    """Uploads a PDF annual report to the reports/ directory."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted.")
    safe = re.sub(r"[^\w\-.]", "_", file.filename)
    dest = REPORTS_DIR / safe
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"ok": True, "filename": safe, "size": dest.stat().st_size}


@app.delete("/reports/{filename}")
def delete_report(filename: str):
    """Deletes an uploaded PDF file."""
    safe = re.sub(r"[^\w\-.]", "_", filename)
    path = REPORTS_DIR / safe
    if not path.exists():
        raise HTTPException(404, "File not found.")
    path.unlink()
    return {"ok": True, "deleted": safe}


@app.post("/run")
async def start_run():
    run_state = new_run()
    loop = asyncio.get_running_loop()
    loop.run_in_executor(None, execute_run, run_state["run_id"])
    return {"run_id": run_state["run_id"], "status": "started"}


@app.get("/run/{run_id}")
def get_run(run_id: str):
    if run_id not in RUNS:
        raise HTTPException(404, "run not found")
    return RUNS[run_id]


@app.get("/run/{run_id}/stream")
async def stream_run(run_id: str):
    if run_id not in RUNS:
        raise HTTPException(404, "run not found")
    return StreamingResponse(
        events.subscribe(run_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/run/{run_id}/artifact/{name}")
def get_artifact(run_id: str, name: str):
    path = ARTIFACTS_DIR / run_id / f"{name}.json"
    if not path.exists():
        raise HTTPException(404, "artifact not found")
    with open(path) as f:
        return json.load(f)


# ── Translation endpoint ──────────────────────────────────────────────────

_TRANSLATE_SYSTEM = """You are a precise JSON translator.
Translate ONLY the Turkish string values to natural English. Rules:
- Keep ALL JSON keys exactly as-is (never translate key names).
- Keep all numbers, booleans, and null values unchanged.
- Keep proper nouns unchanged: brand/company/country/city names such as
  Food Empire, CDSG, Myanmar, Russia, Vietnam, Kazakhstan, CIS, Caffe Bene,
  Indochina, Singapore, India, SGD, USD, etc.
- Keep financial units unchanged (USD, SGD, %, cents, etc.),
  but translate any Turkish surrounding text.
- Values like "up", "down", "flat", "n/a", "joint_venture", "export" are
  already English — keep them exactly.
- Output ONLY valid JSON with no markdown fences and no explanation.
"""


class TranslateRequest(BaseModel):
    artifacts: dict[str, Any]


class TranslateResponse(BaseModel):
    artifacts: dict[str, Any]


def _translate_one(artifact: Any) -> Any:
    """Call Claude to translate a single artifact dict."""
    llm = anthropic.Anthropic(api_key=LLM_API_KEY)
    payload = json.dumps(artifact, ensure_ascii=False)
    msg = llm.messages.create(
        model=MODEL_NAME,
        max_tokens=8192,
        system=_TRANSLATE_SYSTEM,
        messages=[{
            "role": "user",
            "content": (
                "Translate all Turkish string values to English in this JSON "
                "(keep structure, keys, and proper nouns intact):\n\n" + payload
            ),
        }],
    )
    raw = msg.content[0].text.strip()
    # strip markdown fences if present
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(lines[1:])
        if raw.rstrip().endswith("```"):
            raw = raw.rstrip()[:-3].rstrip()
    return json.loads(raw)


@app.post("/translate", response_model=TranslateResponse)
def translate_artifacts(body: TranslateRequest):
    """Translate all Turkish string values in the provided artifacts to English.
    Called by the Next.js /api/pipeline/translate endpoint (one-time migration).
    """
    if not LLM_API_KEY:
        raise HTTPException(500, "LLM_API_KEY not configured")

    translated: dict[str, Any] = {}
    for agent, artifact in body.artifacts.items():
        translated[agent] = _translate_one(artifact)

    return TranslateResponse(artifacts=translated)
