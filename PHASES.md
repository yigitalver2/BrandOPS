# BrandOPS — Build Phases

> Bu dosya PRD'yi uygulanabilir fazlara böler. Her faz sırayla tamamlanır.
> Bir faz bitmeden sonrakine geçme. Her fazın sonunda **Definition of Done (DoD)** kontrol edilir.
> Teknik terimler ve kod İngilizce; açıklamalar Türkçe.

**Stack:** Next.js (App Router) + Tailwind + Framer Motion · FastAPI + LangGraph (Python) · SSE streaming · Vercel + Railway

**Mimari özet:** `Orchestrator → IntelligenceAgent → StrategyAgent → MarketDebateAgent → CampaignAgent`
Her ajan, bir öncekinin doğrulanmış JSON çıktısını tek input olarak alır.

---

## Faz 0 — Hazırlık & Karar

- **0.1** Repo yapısını kur: `/backend` (FastAPI + agents) ve `/frontend` (Next.js) olarak monorepo.
- **0.2** Çalışma modunu netleştir: **(a)** canlı motor her şeyi gerçek zamanlı üretir, **(b)** artifact'lar önceden üretilip doğrulanır, UI canlı akış efektiyle gösterir. Ders teslimi için **(b)** önerilir — motor arkada tam kurulu, demo path sağlam.
- **0.3** `.env` şablonu oluştur: `LLM_API_KEY`, `MODEL_NAME`, `BACKEND_URL`, `FRONTEND_URL`.
- **0.4** Food Empire yıllık rapor kaynaklarını topla (şirketin yatırımcı ilişkileri sayfasındaki PDF linkleri). Erişilemeyenleri not et.

**DoD:** İki klasör de `git init` edilmiş, boş çalışır halde. Çalışma modu kararı yazılı.

---

## Faz 1 — Veri Sözleşmeleri (JSON Schemas)

> Her şeyin temeli. Şemalar önce yazılır ki ajanlar ve frontend aynı kontratı paylaşsın.

- **1.1** `schemas/consolidated_timeline.schema.json` — yıl bazlı kayıt dizisi. Her kayıt: `year`, `key_events`, `geographic_markets[]`, `stated_strategy`, `financials{revenue, profit, key_ratios}`, `risks[]`, `kpis[]`.
- **1.2** `schemas/strategic_analysis.schema.json` — `periods[]` (her biri: `name`, `start_year`, `end_year`, `geographic_focus[]`, `strategy`, `initiatives[]`, `transition_in`, `transition_out`, `financial_summary`, `brand_product_evolution`, `kpi_movement`) + `synthesis_narrative` (string).
- **1.3** `schemas/market_recommendation.schema.json` — `candidates[]` (her biri: `market`, `bull_case`, `bear_case`, `cfo_score`), `recommended_market`, `rationale`, `success_factors[]`, `risks[]` (her biri: `risk`, `mitigation`), `entry_mode`, `entry_mode_justification`, `foodempire_adaptations[]`.
- **1.4** `schemas/campaign_proposal.schema.json` — `target_audience{demographics, psychographics, consumption_habits, unmet_needs[]}`, `value_proposition`, `positioning_statement`, `core_message`, `marketing_mix{product, price, place, promotion}`, `budget{total, line_items[]}`, `gantt[]` (her biri: `activity`, `start_month`, `end_month`), `kpis[]` (her biri: `kpi`, `method`, `target`, `cadence`).
- **1.5** `schemas/run_state.schema.json` — `run_id`, `stages[]` (her biri: `agent`, `status`, `started_at`, `finished_at`, `tokens`, `validation_passed`).
- **1.6** Her şema için minimal örnek (`examples/*.json`) yaz — frontend mock'ları ve test için kullanılacak.

**DoD:** 5 şema + 5 örnek dosya hazır. Örnekler kendi şemalarına karşı valid (bir validator ile doğrula).

---

## Faz 2 — Backend İskelet & Orchestrator

- **2.1** FastAPI app kur: `/health`, `/run` (POST, pipeline başlatır), `/run/{run_id}/stream` (SSE) endpoint'leri.
- **2.2** LangGraph ile state machine tanımla: node sırası `intelligence → strategy → market → campaign`. State objesi tüm artifact'ları taşır.
- **2.3** Ortak `BaseAgent` sınıfı: `run(input) -> output`, içinde LLM çağrısı + schema validation + retry (max 2) + token kaydı.
- **2.4** Validation katmanı: her ajan çıktısı ilgili şemaya karşı kontrol edilir. 2. kez fail olursa `run_state` "needs_review" durumuna geçer ve durur.
- **2.5** SSE publisher: her node başladığında/bittiğinde frontend'e event gönder (`stage_started`, `stage_completed`, `stage_failed`).
- **2.6** Token + latency tracker: her stage için kaydet, `run_state.json`'a yaz.

**DoD:** Boş (mock cevap döndüren) ajanlarla pipeline uçtan uca çalışıyor; SSE event'leri terminalden izlenebiliyor.

---

## Faz 3 — IntelligenceAgent

> PRD Bölüm 1.A · Food Empire raporlarını özetle, sıkıştır, birleştir.

- **3.1** PDF okuma yardımcısı: bir yıllık raporu metne çevir (pdfplumber/pypdf).
- **3.2** Hedefli çıkarım promptu: MD&A, segment raporlaması, finansallar, risk faktörleri, dipnotlar, KPI'lar — PRD'deki guiding question'ları içerir.
- **3.3** İteratif özetleme: çıkarım → özet → özetin özeti (minimum metin). Her yıl için tek yapılandırılmış kayıt üret.
- **3.4** Kayıtları `consolidated_timeline.schema.json` formatında topla, kronolojik sırala.
- **3.5** Erişilemeyen yıllar için fallback: elle girilen özet ya da "veri yok" işareti.

**DoD:** En az 3 gerçek raporla çalıştırılmış, `consolidated_timeline.json` üretilmiş ve şemaya valid.

---

## Faz 4 — StrategyAgent

> PRD Bölüm 1.B · Dönem tespiti + dönem analizi + sentez.

- **4.1** Gecis 1 — Dönem tespiti promptu: konsolide zaman çizelgesinden stratejik dönemleri çıkar (isim, yıllar, coğrafi odak, strateji, girişimler, geçişler). Her sınırı kanıtla.
- **4.2** Gecis 2 — Dönem derinlemesine analiz: her dönem için ayrı çağrı (izole context). PRD'deki 6 soruyu yanıtlar.
- **4.3** Gecis 3 — Sentez: dönem analizlerini tek bir tutarlı anlatıya dokuyan prompt (concatenation değil, through-line).
- **4.4** Çıktıyı `strategic_analysis.schema.json` formatında birleştir.

**DoD:** `strategic_analysis.json` üretilmiş, dönemler mantıklı, sentez anlatısı akıcı, şemaya valid.

---

## Faz 5 — MarketDebateAgent

> PRD Bölüm 1.C · Aday pazarları tartış, birini seç.

- **5.1** Aday pazar listesi belirle (stratejik analiz + CDSG Myanmar bağlamından türet).
- **5.2** Savunucu (Advocate) promptu: her aday için bull case.
- **5.3** Muhalif (Challenger) promptu: her aday için bear case / risk / başarısızlık senaryosu.
- **5.4** CFO filtresi promptu: giriş maliyeti, geri ödeme, risk toleransına göre skorla.
- **5.5** Karar promptu: kazanan pazar + gerekçe + başarı faktörleri + risk/azaltma + giriş modu + Food Empire uyarlamaları.
- **5.6** Çıktıyı `market_recommendation.schema.json` formatında üret.

**DoD:** `market_recommendation.json` üretilmiş, seçim gerekçeli, giriş modu justified, şemaya valid.

---

## Faz 6 — CampaignAgent

> PRD Bölüm 2 · Tam pazarlama kampanyası.

- **6.1** Hedef kitle promptu: demografik + psikografik + tüketim alışkanlıkları + unmet needs.
- **6.2** Değer önerisi + konumlandırma promptu: differentiator, positioning statement, core message, Myanmar avantajı.
- **6.3** 4P promptu: Product / Price / Place / Promotion — her biri PRD detayıyla.
- **6.4** Bütçe + Gantt promptu: kalem bazlı maliyet (gerekçeli) + 12 aylık aktivite takvimi (start/end month).
- **6.5** KPI + ölçüm promptu: KPI seti, ölçüm yöntemi, hedef, raporlama sıklığı.
- **6.6** Çıktıyı `campaign_proposal.schema.json` formatında birleştir.

**DoD:** `campaign_proposal.json` üretilmiş, bütçe toplamı tutarlı, Gantt verisi grafiğe hazır, şemaya valid.

---

## Faz 7 — Frontend İskelet & Routing

- **7.1** Next.js App Router kur, Tailwind config + tema (espresso/copper/cream paleti, serif başlık + sans body).
- **7.2** Sayfa rotaları: `/` (landing), `/run` (canlı çalıştırma), `/intelligence`, `/strategy`, `/market`, `/campaign`, `/engineering`.
- **7.3** Ortak layout: nav, footer, sayfa geçiş animasyonu (Framer Motion).
- **7.4** Artifact'ları okuyan veri katmanı: önce mock (`examples/*.json`), sonra gerçek API.

**DoD:** Tüm rotalar açılıyor, tema uygulanmış, mock data ile sayfalar render oluyor.

---

## Faz 8 — Canlı Çalıştırma Görünümü (SSE)

- **8.1** Dikey pipeline UI: 4 ajan kartı, durum göstergeli (bekliyor / çalışıyor / tamamlandı / hata).
- **8.2** SSE client: `/run/{run_id}/stream`'e bağlan, event'lerle kart durumlarını güncelle.
- **8.3** Stage reveal animasyonu: ajan tamamlandıkça çıktısı belirir (parlamadan, sakin geçiş).
- **8.4** "Pipeline'i Çalıştır" butonu → `/run` POST → stream başlat.

**DoD:** Landing'den çalıştırma başlatılıyor, 4 ajan canlı akışla tamamlanıyor, her biri artifact'ını gösteriyor.

---

## Faz 9 — Artifact Görünümleri

- **9.1** Intelligence view: yıl bazlı kronolojik timeline (yıl kartları, finansal/KPI özet).
- **9.2** Strategy view: dönem kartları + geçiş işaretleri + sentez anlatısı bloğu.
- **9.3** Market view: aday pazarlar tablosu (bull/bear/CFO skor) + seçilen pazar vurgusu + gerekçe/risk/giriş modu.
- **9.4** Campaign view: hedef kitle + konumlandırma + 4P + **interaktif bütçe grafiği** + **Gantt grafiği** + KPI tablosu.
- **9.5** Tüm grafikler JSON artifact'lardan beslenir (hardcode yok).

**DoD:** Her teslim ekranda görünüyor, bütçe ve Gantt görselleştirilmiş, PRD'deki Brief Kapsam Haritası'ndaki 13 madde karşılanıyor.

---

## Faz 10 — Mühendislik Kaydı & Cila

- **10.1** Engineering view: mimari diyagram + stage bazlı token/latency + validation hikayesi.
- **10.2** Responsive pass: mobil + tablet + masaüstü.
- **10.3** Export: artifact'ları indirilebilir yap (JSON ve/veya PDF).
- **10.4** Boş/hata durumları: veri yokken ve stage fail olunca düzgün UI.

**DoD:** Engineering sayfası gerçek metrikleri gösteriyor, her cihazda düzgün, export çalışıyor.

---

## Faz 11 — Deploy & Teslim

- **11.1** Backend'i Railway'e deploy et, env değişkenlerini ayarla.
- **11.2** Frontend'i Vercel'e deploy et, `BACKEND_URL`'i bağla.
- **11.3** Uçtan uca smoke test: canlı URL'de tam pipeline çalıştır.
- **11.4** Brief Kapsam Haritası'na karşı son kontrol — 13 maddenin hepsi ✅.
- **11.5** Teslim paketi: canlı link + export edilmiş artifact'lar + bu repo.

**DoD:** Kamuya açık URL'de sistem uçtan uca çalışıyor, tüm brief teslimleri karşılanmış.

---

## Build Sırası Özeti

```
Faz 0  → Hazırlık
Faz 1  → JSON şemaları           (temel kontrat)
Faz 2  → Orchestrator iskeleti   (boş ajanlarla çalışan pipeline)
Faz 3  → IntelligenceAgent       ┐
Faz 4  → StrategyAgent           │ ajanları sırayla doldur,
Faz 5  → MarketDebateAgent       │ her birini test et
Faz 6  → CampaignAgent           ┘
Faz 7  → Frontend iskelet        (mock data ile)
Faz 8  → Canlı çalıştırma UI     (SSE)
Faz 9  → Artifact görünümleri
Faz 10 → Mühendislik kaydı + cila
Faz 11 → Deploy + teslim
```

**Not:** Zaman darsa Faz 3–6 (ajanlar) artifact'ları elle/yarı-otomatik üretip JSON olarak dondur; Faz 7–9'da frontend bunları canlı akışla gösterir. Motor mimarisi tam kurulu kalır, demo path garanti olur.
