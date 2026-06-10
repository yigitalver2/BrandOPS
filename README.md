# BrandOPS

> Pazar girişi stratejisi ve kampanya tasarımı için otonom bir çok-ajanlı motor.
> CDSG × Food Empire danışmanlık brief'ini doğrulanmış JSON artifact'lar üreten bir pipeline'a dönüştürür.

```
IntelligenceAgent → StrategyAgent → MarketDebateAgent → CampaignAgent
   (Orchestrator zinciri yönetir; her ajan öncekinin doğrulanmış JSON'ını tek input alır)
```

Detaylı ürün gereksinimleri: [`BRANDOPS_PRD_TR.md`](./BRANDOPS_PRD_TR.md) ·
İnşa fazları: [`PHASES.md`](./PHASES.md)

## Monorepo Yapısı

```
BrandOPS/
├── backend/        FastAPI + LangGraph ajan motoru (Python)
├── frontend/       Next.js (App Router) + Tailwind + Framer Motion vitrin arayüzü
├── schemas/        5 JSON şeması (aşamalar arası veri sözleşmeleri)
├── examples/       Her şema için valid örnek artifact (frontend mock + test)
└── docs/           Notlar (kaynaklar, kararlar)
```

## Çalışma Modu Kararı (Faz 0.2)

**Seçilen mod: (b) — Önceden üretilmiş, doğrulanmış artifact'lar + canlı akış efekti.**

Motor (LangGraph + 4 ajan + Orchestrator) arkada **tam kurulu**. Demo için artifact'lar önceden
üretilip şemaya karşı doğrulanır ve `examples/` altında dondurulur; UI bunları SSE ile canlı akış
efektiyle gösterir. Bu, ders teslimi için demo path'ini garanti eder — canlı LLM motoru
(`LLM_API_KEY` verilirse) gerçek zamanlı de çalışır.

## Geliştirme

```bash
# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (ayrı terminal)
cd frontend
npm install
npm run dev
```

`.env.example` → `.env` kopyalayıp `LLM_API_KEY` doldurun (BYOK).

## Teknik Yığın

Next.js · Tailwind · Framer Motion · SSE · FastAPI · LangGraph · Python · JSON-schema ·
Vercel + Railway
