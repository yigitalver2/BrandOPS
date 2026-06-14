"""SSE publisher — one asyncio queue per run; orchestrator publishes events, stream endpoint reads."""
import asyncio
import json
from typing import AsyncIterator

# run_id -> subscriber queues
_subscribers: dict[str, list[asyncio.Queue]] = {}
# run_id -> event history (for replaying to late-connecting clients)
_history: dict[str, list[dict]] = {}


def publish(run_id: str, event: str, data: dict) -> None:
    payload = {"event": event, "data": data}
    _history.setdefault(run_id, []).append(payload)
    for q in _subscribers.get(run_id, []):
        q.put_nowait(payload)


async def subscribe(run_id: str) -> AsyncIterator[str]:
    """Yields SSE-formatted strings; replays history first.

    During long stages (e.g. IntelligenceAgent processing PDFs for minutes) no events
    flow; a heartbeat (SSE comment line) is sent every 15s so proxies don't close the
    idle connection — EventSource ignores it but TCP stays alive.
    """
    q: asyncio.Queue = asyncio.Queue()
    _subscribers.setdefault(run_id, []).append(q)
    try:
        for payload in _history.get(run_id, []):
            yield _format(payload)
            if payload["event"] == "run_finished":
                return
        while True:
            try:
                payload = await asyncio.wait_for(q.get(), timeout=15)
            except asyncio.TimeoutError:
                yield ": ping\n\n"  # heartbeat — keeps the connection alive
                continue
            yield _format(payload)
            if payload["event"] == "run_finished":
                return
    finally:
        _subscribers.get(run_id, []).remove(q)


def _format(payload: dict) -> str:
    return f"event: {payload['event']}\ndata: {json.dumps(payload['data'], ensure_ascii=False)}\n\n"
