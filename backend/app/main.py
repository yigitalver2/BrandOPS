"""BrandOPS backend — FastAPI app: /health, /upload, /run, /run/{run_id}/stream (SSE)."""
import asyncio
import json
import re
import shutil

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .core import events
from .core.config import ARTIFACTS_DIR, FRONTEND_URL, REPORTS_DIR, USE_MOCK_AGENTS
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
    """Yüklü PDF dosyalarını listeler."""
    files = sorted(REPORTS_DIR.glob("*.pdf"))
    return {"reports": [f.name for f in files], "count": len(files)}


@app.post("/upload")
async def upload_report(file: UploadFile = File(...)):
    """PDF yıllık raporunu reports/ klasörüne yükler."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Yalnızca PDF dosyası kabul edilir.")
    # Dosya adını güvenli hale getir
    safe = re.sub(r"[^\w\-.]", "_", file.filename)
    dest = REPORTS_DIR / safe
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"ok": True, "filename": safe, "size": dest.stat().st_size}


@app.delete("/reports/{filename}")
def delete_report(filename: str):
    """Yüklü bir PDF'i siler."""
    safe = re.sub(r"[^\w\-.]", "_", filename)
    path = REPORTS_DIR / safe
    if not path.exists():
        raise HTTPException(404, "Dosya bulunamadı.")
    path.unlink()
    return {"ok": True, "deleted": safe}


@app.post("/run")
async def start_run():
    run_state = new_run()
    loop = asyncio.get_running_loop()
    # ajanlar senkron (LLM SDK) -> thread executor'da çalıştır
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
