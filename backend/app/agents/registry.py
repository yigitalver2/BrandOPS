"""Agent registry — determines which agents run live vs. mock.

Mode (b) philosophy: real agents activate when prerequisites are met (LLM key +
required inputs); otherwise a mock agent that returns a frozen examples/ artifact
is used, so the demo path always works.
"""
from ..core.config import LLM_API_KEY, REPORTS_DIR
from ..core.pdf import discover_reports
from .base import BaseAgent
from .mock import MockAgent

AGENT_ORDER = ["intelligence", "strategy", "market", "campaign"]


def _real_intelligence() -> BaseAgent | None:
    if LLM_API_KEY and discover_reports(REPORTS_DIR):
        from .intelligence import IntelligenceAgent
        return IntelligenceAgent()
    return None


def _real_strategy() -> BaseAgent | None:
    if LLM_API_KEY:
        try:
            from .strategy import StrategyAgent
            return StrategyAgent()
        except ImportError:
            return None
    return None


def _real_market() -> BaseAgent | None:
    if LLM_API_KEY:
        try:
            from .market import MarketDebateAgent
            return MarketDebateAgent()
        except ImportError:
            return None
    return None


def _real_campaign() -> BaseAgent | None:
    if LLM_API_KEY:
        try:
            from .campaign import CampaignAgent
            return CampaignAgent()
        except ImportError:
            return None
    return None


_BUILDERS = {
    "intelligence": _real_intelligence,
    "strategy": _real_strategy,
    "market": _real_market,
    "campaign": _real_campaign,
}


def build_agents() -> dict[str, BaseAgent]:
    """Returns the real agent for each stage when available, otherwise a mock."""
    agents: dict[str, BaseAgent] = {}
    for name in AGENT_ORDER:
        real = _BUILDERS[name]()
        agents[name] = real if real is not None else MockAgent(name)
    return agents
