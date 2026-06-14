"""IntelligenceAgent (Brief Section 1.A) — summarise, compress, and consolidate Food Empire annual reports.

Flow (per year, isolated context):
  PDF -> text -> targeted extraction (INTEL_EXTRACT) -> compression+JSON (INTEL_COMPRESS)
All year records are then sorted chronologically and merged into the consolidated_timeline format.

Fallback for inaccessible years: a minimal record marked data_available=false.
"""
import gc
import json
from datetime import datetime, timezone

from ..core.config import (
    INTEL_COMPRESS_MAX_TOKENS,
    INTEL_EXTRACT_MAX_TOKENS,
    REPORT_TEXT_MAX_CHARS,
    REPORTS_DIR,
)
from ..core.pdf import discover_reports, extract_text
from .base import BaseAgent
from . import prompts


class IntelligenceAgent(BaseAgent):
    name = "intelligence"

    def __init__(self, reports_dir=REPORTS_DIR):
        super().__init__()
        self.reports_dir = reports_dir

    def _year_record(self, year: int, pdf_path) -> dict:
        """Iterative summarisation for a single year: extraction -> compression+JSON."""
        text = extract_text(pdf_path)
        # Truncate very long reports to fit model context and cost budget.
        text = text[:REPORT_TEXT_MAX_CHARS]

        extracted = self._call_llm(
            prompts.INTEL_SYSTEM,
            prompts.INTEL_EXTRACT.format(year=year, report_text=text),
            max_tokens=INTEL_EXTRACT_MAX_TOKENS,
        )
        compressed = self._call_llm(
            prompts.INTEL_SYSTEM,
            prompts.INTEL_COMPRESS.format(year=year, extracted=extracted),
            max_tokens=INTEL_COMPRESS_MAX_TOKENS,
        )
        return self._extract_json(compressed)

    @staticmethod
    def _fallback_record(year: int) -> dict:
        """Minimal 'no data' record for an inaccessible year."""
        return {
            "year": year, "data_available": False,
            "key_events": ["Report not accessible for this year"],
            "geographic_markets": [], "stated_strategy": "No data",
            "financials": {"revenue": None, "profit": None, "key_ratios": []},
            "risks": [], "kpis": [],
        }

    def produce(self, input_data: dict, feedback=None) -> dict:
        reports = discover_reports(self.reports_dir)
        if not reports:
            raise FileNotFoundError(
                f"No PDFs found in {self.reports_dir} — IntelligenceAgent requires "
                "Food Empire annual reports (or use mock mode)."
            )

        print(f"[IntelligenceAgent] {len(reports)} PDF(s) found: {sorted(reports.keys())}", flush=True)

        records: list[dict] = []
        for year in sorted(reports):
            pdf_path = reports[year]
            print(f"[IntelligenceAgent] processing → {year} ({pdf_path.name})", flush=True)
            try:
                rec = self._year_record(year, pdf_path)
                rec["year"] = year  # ensure year is set
                records.append(rec)
                print(f"[IntelligenceAgent] done ✓ {year}", flush=True)
            except Exception as e:
                print(f"[IntelligenceAgent] error ✗ {year}: {e}", flush=True)
                records.append(self._fallback_record(year))
            gc.collect()  # free memory after each PDF

        return {
            "company": "Food Empire Holdings Ltd.",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "records": sorted(records, key=lambda r: r["year"]),
        }
