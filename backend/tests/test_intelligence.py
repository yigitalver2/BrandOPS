"""IntelligenceAgent tests — PDF reading + iterative summarisation + schema validation + fallback.

Verifies agent logic end-to-end without a real LLM/PDF:
  - PDF reading is tested on a real PDF (the repo's PRD)
  - Agent flow is run for 3 synthetic years with a fake LLM; output must be schema-valid
  - Inaccessible year fallback is tested
"""
import json
import sys
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from app.core.pdf import extract_text  # noqa: E402
from app.core.validation import validate_artifact  # noqa: E402
from app.agents.intelligence import IntelligenceAgent  # noqa: E402


def test_pdf_reading_on_real_pdf():
    prd = BACKEND.parent / "BrandOPS_PRD_TR.pdf"
    assert prd.exists(), "PRD PDF not found"
    text = extract_text(prd)
    assert "BrandOPS" in text
    assert len(text) > 500


# Fake LLM: returns plain text for extraction calls, valid JSON for compression calls
def _fake_llm_factory(year_holder):
    def fake(system, user, max_tokens=8192):
        if user.strip().startswith("Below is the Food Empire") and "JSON schema" not in user:
            return "MD&A: growth. Financials: revenue 100M USD, profit 10M USD."
        # compression call -> JSON. Extract year from user content
        import re
        m = re.search(r'"year":\s*(\d{4})', user)
        year = int(m.group(1)) if m else 2020
        return json.dumps({
            "year": year, "data_available": True,
            "key_events": [f"{year} event"],
            "geographic_markets": ["Russia", "Vietnam"],
            "stated_strategy": "Diversification",
            "financials": {"revenue": 100.0, "profit": 10.0,
                           "currency": "USD million",
                           "key_ratios": [{"name": "Net margin", "value": "10%"}]},
            "risks": ["Currency risk"],
            "kpis": [{"name": "CIS share", "value": "60%", "trend": "down"}],
        })
    return fake


def test_intelligence_end_to_end(tmp_path, monkeypatch):
    # 3 fake year reports (empty PDF files; extract_text is monkeypatched)
    for yr in (2020, 2021, 2022):
        (tmp_path / f"FY{yr}.pdf").write_bytes(b"%PDF-1.4 fake")

    agent = IntelligenceAgent(reports_dir=tmp_path)
    monkeypatch.setattr("app.agents.intelligence.extract_text",
                        lambda p: "Food Empire annual report text...")
    monkeypatch.setattr(agent, "_call_llm", _fake_llm_factory(None))

    result = agent.run({})  # BaseAgent.run -> produce + validate
    out = result.output

    # schema-valid
    assert validate_artifact("intelligence", out) == []
    # 3 years, chronological
    years = [r["year"] for r in out["records"]]
    assert years == [2020, 2021, 2022]
    assert result.attempts == 1


def test_fallback_record_for_inaccessible_year(tmp_path, monkeypatch):
    (tmp_path / "FY2019.pdf").write_bytes(b"%PDF fake")
    agent = IntelligenceAgent(reports_dir=tmp_path)

    # extract_text raises -> fallback should activate
    def boom(p):
        raise RuntimeError("Could not read PDF")
    monkeypatch.setattr("app.agents.intelligence.extract_text", boom)

    out = agent.produce({})
    assert validate_artifact("intelligence", out) == []
    rec = out["records"][0]
    assert rec["year"] == 2019
    assert rec["data_available"] is False


def test_no_reports_raises(tmp_path):
    agent = IntelligenceAgent(reports_dir=tmp_path)
    with pytest.raises(FileNotFoundError):
        agent.produce({})
