"""CampaignAgent (Brief Bölüm 2) — seçilen pazar için tam pazarlama kampanyası.

İki geçiş:
  Geçiş 1: hedef kitle + değer önerisi/konumlandırma + 4P
  Geçiş 2: gerekçeli bütçe + 12 aylık Gantt + KPI/ölçüm
Bütçe tutarlılığı (line_items toplamı == total) sağlanır.
Çıktı campaign_proposal.schema.json formatında birleşir.
"""
import json
from datetime import datetime, timezone

from ..core.config import LLM_MAX_TOKENS
from .base import BaseAgent
from . import prompts


class CampaignAgent(BaseAgent):
    name = "campaign"

    def produce(self, input_data: dict, feedback=None) -> dict:
        # input_data = market_recommendation (MarketDebateAgent çıktısı)
        rec_json = json.dumps(input_data, ensure_ascii=False)

        # --- Geçiş 1: kitle + konumlandırma + 4P ---
        plan = self._extract_json(
            self._call_llm(
                prompts.CAMPAIGN_SYSTEM,
                prompts.CAMPAIGN_PLAN.format(recommendation=rec_json),
                max_tokens=LLM_MAX_TOKENS,
            )
        )

        # --- Geçiş 2: bütçe + Gantt + KPI ---
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
        """line_items toplamını total ile tutarlı yap (model aritmetik hatalarına karşı koruma)."""
        items_sum = round(sum(li["amount"] for li in budget.get("line_items", [])), 2)
        budget["total"] = items_sum
        budget.setdefault("currency", "USD")
        return budget
