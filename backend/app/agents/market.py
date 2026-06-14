"""MarketDebateAgent (Brief Section 1.C) — debate candidate markets, select one.

Internal roles implemented via structured debate:
  Pass 1: candidate markets + Advocate (bull) + Skeptic (bear) + CFO score
  Pass 2: decision — winning market, rationale, success factors, risks/mitigations,
           entry mode, Food Empire adaptations
Output merges into the market_recommendation.schema.json format.
"""
import json
from datetime import datetime, timezone

from ..core.config import LLM_MAX_TOKENS
from .base import BaseAgent
from . import prompts


class MarketDebateAgent(BaseAgent):
    name = "market"

    def produce(self, input_data: dict, feedback=None) -> dict:
        # input_data = strategic_analysis (StrategyAgent output)
        analysis_json = json.dumps(input_data, ensure_ascii=False)

        # --- Pass 1: candidate markets + bull/bear + CFO score ---
        debate = self._call_llm(
            prompts.MARKET_SYSTEM,
            prompts.MARKET_DEBATE.format(
                analysis=analysis_json, cdsg=prompts.CDSG_CONTEXT
            ),
            max_tokens=LLM_MAX_TOKENS,
        )
        candidates = self._extract_json(debate)["candidates"]

        # --- Pass 2: decision ---
        decision_raw = self._call_llm(
            prompts.MARKET_SYSTEM,
            prompts.MARKET_DECISION.format(
                candidates=json.dumps(candidates, ensure_ascii=False),
                cdsg=prompts.CDSG_CONTEXT,
            ),
            max_tokens=LLM_MAX_TOKENS,
        )
        decision = self._extract_json(decision_raw)

        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "candidates": candidates,
            "recommended_market": decision["recommended_market"],
            "rationale": decision["rationale"],
            "success_factors": decision["success_factors"],
            "risks": decision["risks"],
            "entry_mode": decision["entry_mode"],
            "entry_mode_justification": decision["entry_mode_justification"],
            "foodempire_adaptations": decision["foodempire_adaptations"],
        }
