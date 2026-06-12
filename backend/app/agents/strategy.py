"""StrategyAgent (Brief Bölüm 1.B) — dönem tespiti + dönem analizi + sentez.

Üç iç geçiş (her biri ayrı LLM çağrısı, izole context):
  Geçiş 1: konsolide zaman çizelgesinden stratejik dönemleri çıkar
  Geçiş 2: her dönem için ayrı, derin analiz (izole bağlam)
  Geçiş 3: dönem analizlerini tek bir through-line anlatıya dok
Çıktı strategic_analysis.schema.json formatında birleşir.
"""
import json
from datetime import datetime, timezone

from .base import BaseAgent
from . import prompts


class StrategyAgent(BaseAgent):
    name = "strategy"

    def produce(self, input_data: dict, feedback=None) -> dict:
        # input_data = consolidated_timeline (IntelligenceAgent çıktısı)
        timeline_json = json.dumps(input_data, ensure_ascii=False)

        # --- Geçiş 1: dönem tespiti ---
        p1 = self._call_llm(
            prompts.STRAT_SYSTEM,
            prompts.STRAT_PASS1.format(timeline=timeline_json),
            max_tokens=3072,
        )
        periods = self._extract_json(p1)["periods"]

        # --- Geçiş 2: her dönem için izole derin analiz ---
        for period in periods:
            p2 = self._call_llm(
                prompts.STRAT_SYSTEM,
                prompts.STRAT_PASS2.format(
                    period=json.dumps(period, ensure_ascii=False),
                    timeline=timeline_json,
                ),
                max_tokens=2048,
            )
            detail = self._extract_json(p2)
            period["financial_summary"] = detail.get("financial_summary", "")
            period["brand_product_evolution"] = detail.get("brand_product_evolution", "")
            period["kpi_movement"] = detail.get("kpi_movement", "")

        # --- Geçiş 3: sentez ---
        p3 = self._call_llm(
            prompts.STRAT_SYSTEM,
            prompts.STRAT_PASS3.format(
                periods=json.dumps(periods, ensure_ascii=False)
            ),
            max_tokens=2048,
        )
        synthesis = self._extract_json(p3)["synthesis_narrative"]

        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "periods": periods,
            "synthesis_narrative": synthesis,
        }
