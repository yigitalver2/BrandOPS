"""Ajan promptları — brief'in guiding question'larını içerir (PRD Bölüm 1 & 2)."""

# ============================ IntelligenceAgent =============================
# Brief Bölüm 1.A — her yıllık rapor için hedefli çıkarım + iteratif özetleme.

INTEL_SYSTEM = """Sen Food Empire Holdings'in yıllık raporlarını analiz eden kıdemli bir \
yatırım analistisin. Görevin: tek bir yıllık raporu okuyup kahve işine dair karar-kalite \
bir özet çıkarmak. Spekülasyon yok — yalnızca rapordaki kanıta dayan. Çıktın bir sonraki \
ajanın (stratejik dönemleştirme) tek girişi olacak, bu yüzden öz ama eksiksiz ol."""

# Geçiş 1: hedefli çıkarım (brief'in guiding question'ları)
INTEL_EXTRACT = """Aşağıda Food Empire'in {year} yıllık raporunun metni var. Brief'in \
istediği bölümlerden bilgi çıkar ve her başlık için maddeler halinde yanıtla:

1. MD&A — genel strateji, pazar koşulları, performans öne çıkanları, gelecek görünümü
2. Segment raporlaması — kahve segmenti geliri, kârı, coğrafi dağılım
3. Finansallar — toplam gelir, net kâr, temel oranlar (brüt/net marj vb.)
4. Risk faktörleri — kahve ve pazara bağlı zorluklar ve fırsatlar
5. Dipnotlar — önemli işlemler, yatırımlar, satın almalar, muhasebe politikaları
6. KPI'lar — yılın temel göstergeleri ve önceki yıla göre yönü (arttı/azaldı/sabit)

Sadece raporda yer alan bilgileri yaz. Rakamları para birimiyle belirt.

--- RAPOR METNİ ({year}) ---
{report_text}
--- METİN SONU ---"""

# Geçiş 2: özetin özeti (sıkıştırma) + yapılandırılmış JSON
INTEL_COMPRESS = """Aşağıda Food Empire'in {year} raporundan çıkarılmış bilgiler var. \
Bunu minimum uygulanabilir metne sıkıştır ve TAM OLARAK şu JSON şemasında tek bir yıl \
kaydı üret (başka metin yazma, sadece JSON):

{{
  "year": {year},
  "data_available": true,
  "key_events": ["..."],
  "geographic_markets": ["..."],
  "stated_strategy": "tek paragraf",
  "financials": {{
    "revenue": <sayı veya "string">,
    "profit": <sayı veya "string">,
    "currency": "USD milyon vb.",
    "key_ratios": [{{"name": "...", "value": "..."}}]
  }},
  "risks": ["..."],
  "kpis": [{{"name": "...", "value": "...", "trend": "up|down|flat|n/a"}}]
}}

--- ÇIKARILMIŞ BİLGİLER ({year}) ---
{extracted}
--- SON ---"""

INTEL_RETRY_SUFFIX = """\n\nÖNEMLİ: Önceki yanıtın şu şema hatalarını verdi, düzelt:\n{errors}\n\
Sadece geçerli JSON döndür."""


# ============================== StrategyAgent ==============================
# Brief Bölüm 1.B — üç iç geçiş: dönem tespiti, izole derin analiz, sentez.

STRAT_SYSTEM = """Sen şirket stratejisi üzerine çalışan kıdemli bir strateji \
danışmanısın. Görevin Food Empire'in konsolide zaman çizelgesinden stratejik dönemleri \
tespit etmek, her dönemi ayrı analiz etmek ve hepsini tek bir tutarlı anlatıya dokumak. \
İddialarını yalnızca verilen zaman çizelgesindeki kanıta dayandır."""

# Geçiş 1 — Stratejik dönem tespiti
STRAT_PASS1 = """Aşağıda Food Empire'in yıl bazlı konsolide zaman çizelgesi (JSON) var. \
Stratejik dönemleri tespit et. Her dönem için:
- name: dönemi tanımlayan kısa, ayırt edici bir isim
- start_year / end_year
- geographic_focus: o dönemin coğrafi öncelikleri (liste)
- strategy: dönemin genel stratejisi (1-2 cümle)
- initiatives: o dönemin önemli girişimleri (liste)
- transition_in: dönemi başlatan olay/karar (hangi kanıt?)
- transition_out: dönemi bitiren olay/karar (hangi kanıt?)

Her dönem sınırını zaman çizelgesindeki SOMUT kanıtla (olay, finansal kırılma, strateji \
değişimi) gerekçelendir. Dönemler kronolojik ve örtüşmesiz olmalı.

SADECE şu formatta JSON döndür (başka metin yok):
{{"periods": [{{"name": "...", "start_year": 2023, "end_year": 2024, "geographic_focus": ["..."], "strategy": "...", "initiatives": ["..."], "transition_in": "...", "transition_out": "..."}}]}}

--- KONSOLİDE ZAMAN ÇİZELGESİ ---
{timeline}
--- SON ---"""

# Geçiş 2 — tek bir dönemin izole, derin analizi
STRAT_PASS2 = """Aşağıda Food Empire'in konsolide zaman çizelgesi ve odaklanılacak TEK bir \
stratejik dönem var. SADECE bu dönemi derinlemesine analiz et ve brief'in sorularını yanıtla:
- financial_summary: coğrafi odak, özgül strateji, finansal performans (başarılar, zorluklar, trendler) — tek paragraf
- brand_product_evolution: strateji, pazar odağı, ürün teklifi ve markalaşmadaki değişimler — tek paragraf
- kpi_movement: marka/ürün stratejisinin evrimi ve KPI'ların hareketi — tek paragraf

SADECE şu JSON'ı döndür (başka metin yok):
{{"financial_summary": "...", "brand_product_evolution": "...", "kpi_movement": "..."}}

--- ODAK DÖNEM ---
{period}

--- BAĞLAM: KONSOLİDE ZAMAN ÇİZELGESİ ---
{timeline}
--- SON ---"""

# Geçiş 3 — sentez (through-line; concatenation değil)
STRAT_PASS3 = """Aşağıda Food Empire'in stratejik dönemleri (analizleriyle) var. Bunları \
TEK bir tutarlı anlatıya dok — dönemlerin birleştirilmiş özeti değil, bir ÜST ÇİZGİSİ \
(through-line) olan bir hikaye. Food Empire'in gidişatındaki temel mantığı, tekrar eden \
örüntüyü ve stratejik evrimi ortaya koy. 1-3 paragraf, akıcı düzyazı.

SADECE şu JSON'ı döndür: {{"synthesis_narrative": "..."}}

--- DÖNEMLER VE ANALİZLERİ ---
{periods}
--- SON ---"""
