"""IntelligenceAgent testleri — PDF okuma + iteratif özetleme + şema doğrulama + fallback.

Gerçek LLM/PDF olmadan ajan mantığını uçtan uca doğrular:
  - PDF okuma gerçek bir PDF (repo'daki PRD) üzerinde test edilir
  - 3 sentetik yıl için ajan akışı sahte LLM ile çalıştırılır, çıktı şemaya valid olmalı
  - Erişilemeyen yıl fallback'i test edilir
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
    assert prd.exists(), "PRD PDF bulunamadı"
    text = extract_text(prd)
    assert "BrandOPS" in text
    assert len(text) > 500


# Sahte LLM: çıkarım çağrısında düz metin, sıkıştırma çağrısında geçerli JSON döndürür
def _fake_llm_factory(year_holder):
    def fake(system, user, max_tokens=8192):
        if user.strip().startswith("Aşağıda Food Empire") and "JSON şemasında" not in user:
            return "MD&A: büyüme. Finansallar: gelir 100M USD, kâr 10M USD."
        # sıkıştırma çağrısı -> JSON. user içinden yılı yakala
        import re
        m = re.search(r'"year":\s*(\d{4})', user)
        year = int(m.group(1)) if m else 2020
        return json.dumps({
            "year": year, "data_available": True,
            "key_events": [f"{year} olayı"],
            "geographic_markets": ["Rusya", "Vietnam"],
            "stated_strategy": "Çeşitlendirme",
            "financials": {"revenue": 100.0, "profit": 10.0,
                           "currency": "USD milyon",
                           "key_ratios": [{"name": "Net marj", "value": "10%"}]},
            "risks": ["Döviz riski"],
            "kpis": [{"name": "BDT payı", "value": "60%", "trend": "down"}],
        })
    return fake


def test_intelligence_end_to_end(tmp_path, monkeypatch):
    # 3 sahte yıl raporu (boş PDF dosyaları; extract_text monkeypatch'lenecek)
    for yr in (2020, 2021, 2022):
        (tmp_path / f"FY{yr}.pdf").write_bytes(b"%PDF-1.4 fake")

    agent = IntelligenceAgent(reports_dir=tmp_path)
    monkeypatch.setattr("app.agents.intelligence.extract_text",
                        lambda p: "Food Empire yıllık rapor metni...")
    monkeypatch.setattr(agent, "_call_llm", _fake_llm_factory(None))

    result = agent.run({})  # BaseAgent.run -> produce + validate
    out = result.output

    # şemaya valid
    assert validate_artifact("intelligence", out) == []
    # 3 yıl, kronolojik
    years = [r["year"] for r in out["records"]]
    assert years == [2020, 2021, 2022]
    assert result.attempts == 1


def test_fallback_record_for_inaccessible_year(tmp_path, monkeypatch):
    (tmp_path / "FY2019.pdf").write_bytes(b"%PDF fake")
    agent = IntelligenceAgent(reports_dir=tmp_path)

    # extract_text patlatılır -> fallback devreye girmeli
    def boom(p):
        raise RuntimeError("PDF okunamadı")
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
