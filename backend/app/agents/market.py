"""MarketDebateAgent (Brief Bölüm 1.C) — aday pazarları tartış, birini seç.

İç roller yapılandırılmış tartışmayla uygulanır:
  Geçiş 1: aday pazarlar + Savunucu (bull) + Muhalif (bear) + CFO skoru
  Geçiş 2: karar — kazanan pazar, gerekçe, başarı faktörleri, risk/azaltma,
           giriş modu, Food Empire uyarlamaları
Çıktı market_recommendation.schema.json formatında birleşir.
"""
import json
from datetime import datetime, timezone

from .base import BaseAgent
from . import prompts


class MarketDebateAgent(BaseAgent):
    name = "market"

    def produce(self, input_data: dict, feedback=None) -> dict:
        # input_data = strategic_analysis (StrategyAgent çıktısı)
        analysis_json = json.dumps(input_data, ensure_ascii=False)

        # --- Geçiş 1: aday pazarlar + bull/bear + CFO skor ---
        debate = self._call_llm(
            prompts.MARKET_SYSTEM,
            prompts.MARKET_DEBATE.format(
                analysis=analysis_json, cdsg=prompts.CDSG_CONTEXT
            ),
            max_tokens=3072,
        )
        candidates = self._extract_json(debate)["candidates"]

        # --- Geçiş 2: karar ---
        decision_raw = self._call_llm(
            prompts.MARKET_SYSTEM,
            prompts.MARKET_DECISION.format(
                candidates=json.dumps(candidates, ensure_ascii=False),
                cdsg=prompts.CDSG_CONTEXT,
            ),
            max_tokens=3072,
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
