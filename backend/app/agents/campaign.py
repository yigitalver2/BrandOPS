"""CampaignAgent (Brief Section 2) — full marketing campaign for the selected market.

Two passes:
  Pass 1: target audience + value proposition/positioning + 4Ps
  Pass 2: justified budget + 12-month Gantt + KPI/measurement
Budget consistency (sum of line_items == total) is enforced.
Output merges into the campaign_proposal.schema.json format.
"""
import json
from datetime import datetime, timezone

from ..core.config import LLM_MAX_TOKENS
from .base import BaseAgent
from . import prompts


class CampaignAgent(BaseAgent):
    name = "campaign"

    def produce(self, input_data: dict, feedback=None) -> dict:
        # input_data = market_recommendation (MarketDebateAgent output)
        rec_json = json.dumps(input_data, ensure_ascii=False)

        # --- Pass 1: audience + positioning + 4Ps ---
        plan = self._extract_json(
            self._call_llm(
                prompts.CAMPAIGN_SYSTEM,
                prompts.CAMPAIGN_PLAN.format(recommendation=rec_json),
                max_tokens=LLM_MAX_TOKENS,
            )
        )

        # --- Pass 2: budget + Gantt + KPIs ---
        ops = self._extract_json(
            self._call_llm(
                prompts.CAMPAIGN_SYSTEM,
                prompts.CAMPAIGN_OPS.format(
                    core=json.dumps(plan, ensure_ascii=False),
                    recommendation=rec_json,
                ),
                max_tokens=LLM_MAX_TOKENS,
            )
        )

        budget = self._reconcile_budget(ops["budget"])

        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "target_audience": plan["target_audience"],
            "value_proposition": plan["value_proposition"],
            "positioning_statement": plan["positioning_statement"],
            "core_message": plan["core_message"],
            "marketing_mix": plan["marketing_mix"],
            "budget": budget,
            "gantt": ops["gantt"],
            "kpis": ops["kpis"],
        }

    @staticmethod
    def _reconcile_budget(budget: dict) -> dict:
        """Align line_items sum with total (guard against model arithmetic errors)."""
        items_sum = round(sum(li["amount"] for li in budget.get("line_items", [])), 2)
        budget["total"] = items_sum
        budget.setdefault("currency", "USD")
        return budget
