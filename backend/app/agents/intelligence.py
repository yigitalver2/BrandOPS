"""IntelligenceAgent (Brief Bölüm 1.A) — Food Empire yıllık raporlarını özetle, sıkıştır, birleştir.

Akış (her yıl için, izole context):
  PDF -> metin -> hedefli çıkarım (INTEL_EXTRACT) -> sıkıştırma+JSON (INTEL_COMPRESS)
Sonra tüm yıl kayıtları kronolojik sıralanıp consolidated_timeline formatında birleşir.

Erişilemeyen yıllar için fallback: data_available=false işaretli minimal kayıt.
"""
import json
from datetime import datetime, timezone

from ..core.config import REPORTS_DIR
from ..core.pdf import discover_reports, extract_text
from .base import BaseAgent
from . import prompts


class IntelligenceAgent(BaseAgent):
    name = "intelligence"

    def __init__(self, reports_dir=REPORTS_DIR):
        super().__init__()
        self.reports_dir = reports_dir

    def _year_record(self, year: int, pdf_path) -> dict:
        """Tek yıl için iteratif özetleme: çıkarım -> sıkıştırma+JSON."""
        text = extract_text(pdf_path)
        # Çok uzun raporları model bağlamına sığdır (ilk ~60k karakter yeterli kapsam)
        text = text[:60000]

        extracted = self._call_llm(
            prompts.INTEL_SYSTEM,
            prompts.INTEL_EXTRACT.format(year=year, report_text=text),
            max_tokens=2048,
        )
        compressed = self._call_llm(
            prompts.INTEL_SYSTEM,
            prompts.INTEL_COMPRESS.format(year=year, extracted=extracted),
            max_tokens=2048,
        )
        return self._extract_json(compressed)

    @staticmethod
    def _fallback_record(year: int) -> dict:
        """Erişilemeyen yıl için 'veri yok' işaretli minimal kayıt."""
        return {
            "year": year, "data_available": False,
            "key_events": ["Bu yıl için rapor erişilemedi"],
            "geographic_markets": [], "stated_strategy": "Veri yok",
            "financials": {"revenue": None, "profit": None, "key_ratios": []},
            "risks": [], "kpis": [],
        }

    def produce(self, input_data: dict, feedback=None) -> dict:
        reports = discover_reports(self.reports_dir)
        if not reports:
            raise FileNotFoundError(
                f"{self.reports_dir} içinde PDF yok — IntelligenceAgent için "
                "Food Empire yıllık raporları gerekli (ya da mock mod kullanın)."
            )

        records: list[dict] = []
        for year in sorted(reports):
            try:
                rec = self._year_record(year, reports[year])
                rec["year"] = year  # garantiye al
                records.append(rec)
            except Exception:
                records.append(self._fallback_record(year))

        return {
            "company": "Food Empire Holdings Ltd.",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "records": sorted(records, key=lambda r: r["year"]),
        }
