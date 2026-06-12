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
