# BrandOPS — Deploy & Teslim (Faz 11)

İki servis: **backend → Railway**, **frontend → Vercel**.

## Ön hazırlık
```bash
# Backend'i self-contained yap (canonical schemas/examples'ı kopyalar)
cd backend && ./sync_assets.sh && cd ..
git add -A && git commit -m "deploy assets sync" && git push
```

## 1) Backend — Railway
1. [railway.app](https://railway.app) → New Project → Deploy from GitHub repo.
2. **Root Directory:** `backend`
3. Railway otomatik `railway.json` / `Procfile` algılar (NIXPACKS, Python 3.12).
4. **Variables** (Settings → Variables):
   - `LLM_API_KEY` = `<Claude API anahtarın>`
   - `MODEL_NAME` = `claude-opus-4-8`
   - `FRONTEND_URL` = `<Vercel URL'in>` (CORS için; önce deploy edip sonra geri dön)
   - `USE_MOCK_AGENTS` = `true`  ← demo için (canlı üretim yerine donmuş artifact'lar; SSE akışı çalışır, LLM maliyeti olmaz)
   - *(Not: `USE_MOCK_AGENTS=auto` + PDF yoksa zaten mock'a düşer.)*
5. Deploy sonrası public URL: `https://<proje>.up.railway.app` → `/health` ile test et.

## 2) Frontend — Vercel
1. [vercel.com](https://vercel.com) → Add New → Project → repo'yu içe aktar.
2. **Root Directory:** `frontend`
3. Framework: Next.js (otomatik).
4. **Environment Variables:**
   - `NEXT_PUBLIC_BACKEND_URL` = `<Railway backend URL'in>`
5. Deploy → public URL: `https://<proje>.vercel.app`
6. Railway'deki `FRONTEND_URL`'i bu Vercel URL'iyle güncelle (CORS).

## 3) Uçtan uca smoke test
- Vercel URL'ini aç → landing görünür.
- **Pipeline'i Çalıştır** → 4 ajan SSE ile sırayla tamamlanır (mock modda donmuş, doğrulanmış artifact'lar akar).
- `/intelligence`, `/strategy`, `/market`, `/campaign`, `/engineering` → hepsi gerçek veriyle render.
- Her artifact sayfasında **JSON indir** çalışır.

## 4) Brief Kapsam Haritası — 13 madde
PRD Bölüm 08'deki 13 zorunlu teslim → hepsi karşılanıyor (bkz. README "Kapsam" tablosu).

## Teslim paketi
- Canlı link (Vercel) + backend (Railway)
- Export edilmiş artifact'lar (`examples/*.json` — gerçek Food Empire/CDSG çıktıları)
- Bu repo (git geçmişi faz faz)
