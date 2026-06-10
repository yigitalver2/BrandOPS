"""Orchestrator — LangGraph state machine: intelligence → strategy → market → campaign.

Her node:
  1. stage_started event'i basar
  2. ajanı çalıştırır (BaseAgent.run: LLM/mock + validation + retry)
  3. artifact'ı state'e ve diske yazar, stage_completed basar
  4. ValidationFailure'da run "needs_review" durumuna geçer ve pipeline durur
"""
import json
import uuid
from datetime import datetime, timezone
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from ..agents.base import BaseAgent, ValidationFailure
from ..agents.mock import make_mock_agents
from .config import ARTIFACTS_DIR, USE_MOCK_AGENTS
from .events import publish
from .validation import validate_artifact

AGENT_ORDER = ["intelligence", "strategy", "market", "campaign"]

_ARTIFACT_NAMES = {
    "intelligence": "consolidated_timeline",
    "strategy": "strategic_analysis",
    "market": "market_recommendation",
    "campaign": "campaign_proposal",
}

# run_id -> run_state dict (in-memory depo; ayrıca diske yazılır)
RUNS: dict[str, dict] = {}


class PipelineState(TypedDict, total=False):
    run_id: str
    artifacts: dict[str, Any]  # agent adı -> doğrulanmış çıktı
    halted: bool


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _stage(run_state: dict, agent: str) -> dict:
    return next(s for s in run_state["stages"] if s["agent"] == agent)


def _persist(run_state: dict) -> None:
    run_dir = ARTIFACTS_DIR / run_state["run_id"]
    run_dir.mkdir(exist_ok=True)
    with open(run_dir / "run_state.json", "w") as f:
        json.dump(run_state, f, ensure_ascii=False, indent=2)


def _make_node(agent: BaseAgent):
    def node(state: PipelineState) -> PipelineState:
        if state.get("halted"):
            return state
        run_state = RUNS[state["run_id"]]
        stage = _stage(run_state, agent.name)
        stage["status"] = "running"
        stage["started_at"] = _now()
        publish(state["run_id"], "stage_started", {"agent": agent.name})
        try:
            # önceki ajanın doğrulanmış çıktısı tek input
            idx = AGENT_ORDER.index(agent.name)
            input_data = (
                state["artifacts"].get(AGENT_ORDER[idx - 1], {}) if idx > 0 else {}
            )
            result = agent.run(input_data)
        except ValidationFailure as exc:
            stage.update(
                status="needs_review", finished_at=_now(),
                validation_passed=False, error="; ".join(exc.errors[:5]),
            )
            run_state["status"] = "needs_review"
            _persist(run_state)
            publish(state["run_id"], "stage_failed",
                    {"agent": agent.name, "errors": exc.errors[:5]})
            state["halted"] = True
            return state
        except Exception as exc:  # LLM/IO hatası
            stage.update(status="failed", finished_at=_now(),
                         validation_passed=False, error=str(exc))
            run_state["status"] = "failed"
            _persist(run_state)
            publish(state["run_id"], "stage_failed",
                    {"agent": agent.name, "errors": [str(exc)]})
            state["halted"] = True
            return state

        stage.update(
            status="completed", finished_at=_now(), tokens=result.tokens,
            latency_ms=round(result.latency_ms, 1), attempts=result.attempts,
            validation_passed=True, error=None,
        )
        state["artifacts"][agent.name] = result.output
        run_dir = ARTIFACTS_DIR / state["run_id"]
        run_dir.mkdir(exist_ok=True)
        with open(run_dir / f"{_ARTIFACT_NAMES[agent.name]}.json", "w") as f:
            json.dump(result.output, f, ensure_ascii=False, indent=2)
        _persist(run_state)
        publish(state["run_id"], "stage_completed",
                {"agent": agent.name, "artifact": result.output,
                 "tokens": result.tokens, "latency_ms": stage["latency_ms"]})
        return state

    return node


def build_graph(agents: dict[str, BaseAgent] | None = None):
    agents = agents or make_real_or_mock_agents()
    g = StateGraph(PipelineState)
    for name in AGENT_ORDER:
        g.add_node(name, _make_node(agents[name]))
    g.set_entry_point(AGENT_ORDER[0])
    for a, b in zip(AGENT_ORDER, AGENT_ORDER[1:]):
        g.add_edge(a, b)
    g.add_edge(AGENT_ORDER[-1], END)
    return g.compile()


def make_real_or_mock_agents() -> dict[str, BaseAgent]:
    if USE_MOCK_AGENTS:
        return make_mock_agents()
    # Faz 3-6'da gerçek ajanlar buraya bağlanacak
    from ..agents.mock import make_mock_agents as _mk
    return _mk()


def new_run() -> dict:
    run_id = f"run_{uuid.uuid4().hex[:8]}"
    run_state = {
        "run_id": run_id,
        "status": "pending",
        "started_at": None,
        "finished_at": None,
        "stages": [
            {"agent": a, "status": "pending", "started_at": None, "finished_at": None,
             "tokens": {"input": 0, "output": 0, "total": 0}, "latency_ms": None,
             "attempts": 0, "validation_passed": False, "error": None}
            for a in AGENT_ORDER
        ],
    }
    RUNS[run_id] = run_state
    return run_state


def execute_run(run_id: str) -> None:
    """Senkron pipeline yürütme (thread executor'da çağrılır)."""
    run_state = RUNS[run_id]
    run_state["status"] = "running"
    run_state["started_at"] = _now()
    _persist(run_state)
    publish(run_id, "run_started", {"run_id": run_id})

    graph = build_graph()
    final = graph.invoke({"run_id": run_id, "artifacts": {}, "halted": False})

    if run_state["status"] == "running":  # hiçbir aşama durdurmadıysa
        run_state["status"] = "completed"
    run_state["finished_at"] = _now()

    # run_state kendisi de şemaya karşı doğrulanır (kendi yemeğini yemek)
    errors = validate_artifact("run_state", run_state)
    if errors:
        publish(run_id, "warning", {"run_state_schema_errors": errors[:5]})

    _persist(run_state)
    publish(run_id, "run_finished",
            {"run_id": run_id, "status": run_state["status"],
             "artifacts_ready": list(final.get("artifacts", {}).keys())})
