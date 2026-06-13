"""SSE publisher — her run için bir asyncio kuyruğu; orchestrator event basar, stream endpoint okur."""
import asyncio
import json
from typing import AsyncIterator

# run_id -> abone kuyrukları
_subscribers: dict[str, list[asyncio.Queue]] = {}
# run_id -> geçmiş event'ler (geç bağlanan client'lar için replay)
_history: dict[str, list[dict]] = {}


def publish(run_id: str, event: str, data: dict) -> None:
    payload = {"event": event, "data": data}
    _history.setdefault(run_id, []).append(payload)
    for q in _subscribers.get(run_id, []):
        q.put_nowait(payload)


async def subscribe(run_id: str) -> AsyncIterator[str]:
    """SSE formatında string'ler üretir; önce geçmişi replay eder.

    Uzun aşamalar (ör. IntelligenceAgent dakikalarca PDF işler) sırasında hiç
    event akmaz; proxy boş bağlantıyı kesmesin diye her 15sn'de heartbeat
    (SSE yorum satırı) gönderilir — EventSource bunu yok sayar ama TCP canlı kalır.
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
                yield ": ping\n\n"  # heartbeat — bağlantıyı diri tutar
                continue
            yield _format(payload)
            if payload["event"] == "run_finished":
                return
    finally:
        _subscribers.get(run_id, []).remove(q)


def _format(payload: dict) -> str:
    return f"event: {payload['event']}\ndata: {json.dumps(payload['data'], ensure_ascii=False)}\n\n"
