"""StrategyAgent (Brief Section 1.B) — period detection + period analysis + synthesis.

Three internal passes (each a separate LLM call with isolated context):
  Pass 1: extract strategic periods from the consolidated timeline
  Pass 2: deep isolated analysis for each period
  Pass 3: weave period analyses into a single through-line narrative
Output merges into the strategic_analysis.schema.json format.
"""
import json
from datetime import datetime, timezone

from ..core.config import LLM_MAX_TOKENS
from .base import BaseAgent
from . import prompts


class StrategyAgent(BaseAgent):
    name = "strategy"

    def produce(self, input_data: dict, feedback=None) -> dict:
        # input_data = consolidated_timeline (IntelligenceAgent output)
        timeline_json = json.dumps(input_data, ensure_ascii=False)

        # --- Pass 1: period detection ---
        p1 = self._call_llm(
            prompts.STRAT_SYSTEM,
            prompts.STRAT_PASS1.format(timeline=timeline_json),
            max_tokens=LLM_MAX_TOKENS,
        )
        periods = self._extract_json(p1)["periods"]

        # --- Pass 2: isolated deep analysis per period ---
        for period in periods:
            p2 = self._call_llm(
                prompts.STRAT_SYSTEM,
                prompts.STRAT_PASS2.format(
                    period=json.dumps(period, ensure_ascii=False),
                    timeline=timeline_json,
                ),
                max_tokens=LLM_MAX_TOKENS,
            )
            detail = self._extract_json(p2)
            period["financial_summary"] = detail.get("financial_summary", "")
            period["brand_product_evolution"] = detail.get("brand_product_evolution", "")
            period["kpi_movement"] = detail.get("kpi_movement", "")

        # --- Pass 3: synthesis ---
        p3 = self._call_llm(
            prompts.STRAT_SYSTEM,
            prompts.STRAT_PASS3.format(
                periods=json.dumps(periods, ensure_ascii=False)
            ),
            max_tokens=LLM_MAX_TOKENS,
        )
        synthesis = self._extract_json(p3)["synthesis_narrative"]

        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "periods": periods,
            "synthesis_narrative": synthesis,
        }
