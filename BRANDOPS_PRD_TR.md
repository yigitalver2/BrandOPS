# BrandOPS — Ürün Gereksinimleri Dokümanı (PRD v1.0)

> Pazar girişi stratejisi ve kampanya tasarımı için otonom bir motor.
> **Hazırlayan:** Yigit Alver · **Ders Projesi:** AI-Powered IMC · **Durum:** Geliştirmeye Hazır

BrandOPS, CDSG × Food Empire danışmanlık briefini eksiksiz bir çok-ajanlı pipeline'a
dönüştürüyor. Yıllık raporları analiz eder, stratejik dönemi haritalar, hedef pazarı tartışarak
seçer ve tam bir pazarlama kampanyası üretir; hepsini canlı bir arayüz üzerinden sunar.

---

## 01 · Genel Bakış — BrandOPS Nedir?

BrandOPS bir **otonom strateji motorudur**. Food Empire'in yıllık raporlarını ve CDSG'nin
bağlamını verirsiniz; size eksiksiz bir danışmanlık çıktısı döner: Food Empire'in kahve işinin
stratejik analizi, CDSG için gerekçelendirilen bir pazar giriş önerisi ve bütçe, zaman çizelgesi
ile KPI'ları içeren tam bir pazarlama kampanyası önerisi.

Proje brief'i **manuel** bir iş akışı tanımlıyor: her raporu indir, LLM'e yapıştır, sorular sor,
özet çıkar, özetin özetini çıkar, tekrarla; sonra stratejik dönemi belirlemek için yeni bir oturum
aç, her dönemi ayrı analiz et, hepsini sentezle. BrandOPS bu iş akışını **yazılıma dönüştürüyor**
— her manuel adım, tanımlı bir rol, giriş sözleşmesi ve doğrulanmış çıkışı olan otonom bir ajana
dönüşüyor.

### Temel Tez
Brief, aslında bir ajan pipeline'ı için bir spesifikasyondur. Yinelemeli özetlemeyi, token yönetimi
için çoklu oturum izolasyonunu ve her LLM çıktısının eleştirel doğrulamasını zaten öngörüyor.
BrandOPS bu spesifikasyonu manuel emek yerine yazılım olarak uyguluyor.

### Çözdüğü Problem
Myanmar merkezli bir holding şirketi olan CDSG, halka açık bir Singapurlu gıda şirketi olan Food
Empire'i model alarak bölgesel kahve işini büyütmek ve sürdürülebilir kârlılığa ulaşmak istiyor.

> "CDSG bölgesel kahve pazarında sürdürülebilir kârlılığa ulaşmak için nasıl bir stratejik çerçeve
> ve eylem planı benimsemelidir?"

---

## 02 · Sistemin Özeti — Brief'ten Pipeline'a

| Proje brief'i ne istiyor | BrandOPS ajanı | Doğrulanmış çıktı |
|---|---|---|
| Her yıllık raporun yinelemeli özetlenmesi + kronolojik birleştirme (Bölüm 1.A) | **IntelligenceAgent** | `consolidated_timeline.json` |
| Stratejik dönem tespiti, her dönemin ayrı analizi, sentez (Bölüm 1.B) | **StrategyAgent** | `strategic_analysis.json` |
| Gerekçe, risk ve giriş moduyla hedef pazar önerisi (Bölüm 1.C) | **MarketDebateAgent** | `market_recommendation.json` |
| Tam kampanya: kitle, konumlandırma, 4P, bütçe, Gantt, KPI (Bölüm 2) | **CampaignAgent** | `campaign_proposal.json` |
| Her aşamayı sıralama, doğrulama ve durum aktarımı | **Orchestrator** | `run_state.json` |

**Otomatikleştirilen:** Rapor özetleme/sıkıştırma · Stratejik dönem tespiti · Pazar puanlama ve
çekişmeli tartışma · Kampanya ve bütçe üretimi · Her adımda şema doğrulama + yeniden deneme.

**İnsanda kalan:** Her ajan çıktısının eleştirel incelemesi · Pazar seçiminde nihai karar · Prompt
ve dönem sınırları ayarı · Nihai raporun anlatı sesi · Teslimatlar önce onay.

### Tasarım İlkesi — Brief'e Sadakat
Brief, her LLM çıktısının eleştirel olarak doğrulanmasını açıkça talep ediyor. BrandOPS hiçbir model
yanıtını nihai olarak kabul etmiyor: her ajanın sonucu şema kontrolünden geçiyor, insan incelemesi
için arayüzde gösteriliyor ve aşağı akışına aktarılmadan önce düzenlenebiliyor.

---

## 03 · Mimari — Pipeline

Beş bileşenli, doğrusal bir zincir. Orchestrator çalıştırmayı yönetiyor; her uzman ajan, önceki
ajanın doğrulanmış JSON'ını **tek giriş** olarak alıyor. Bu, brief'in "her dönem için ayrı oturum"
talimatını yansıtıyor — izolasyon her aşamayı odaklı ve token sınırı içinde tutuyor.

```
GİRDİ: Food Empire Yıllık Raporları + CDSG Bağlamı
   ↓
AJAN 01 · IntelligenceAgent  → consolidated_timeline.json   (alım & sıkıştırma)
   ↓
AJAN 02 · StrategyAgent      → strategic_analysis.json      (dönemleştirme & sentez)
   ↓
AJAN 03 · MarketDebateAgent  → market_recommendation.json   (tartışma & karar)
   ↓
AJAN 04 · CampaignAgent      → campaign_proposal.json       (planlama & maliyetlendirme)
   ↓
ÇIKTI: Canlı Vitrin Arayüzü (her artifact görüntülenir, canlı akar, dışarı aktarılabilir)
```

### Orchestration Sözleşmesi
Orchestrator çalıştırma durumuna sahip. Her ajanı sırayla tetikliyor, önceki çıktı şema
doğrulamasını geçene kadar bekliyor, bozuk yanıtlarda yeniden deniyor ve aşama başına süre ile
token kullanımını kaydediyor. Herhangi bir ajan doğrulama adımında **iki kez** başarısız olursa,
kötü veriyi ilerletmek yerine insan müdahalesi için durakıyor (`needs_review`).

---

## 04 · Ajan Spesifikasyonları

### 01 · IntelligenceAgent — alım · özetleme · sıkıştırma · birleştirme
**Brief Bölüm 1.A — Food Empire Vaka Çalışması**

Her yıllık raporu okur ve brief'in özetleme adımlarını uygular: ilgili bölümlerden bilgi çıkar,
hedef soruları yanıtla, özetle, sonra özetin özetini çıkararak minimum uygulanabilir metne in.

Her rapor için çıkarılan bilgiler:
- **MD&A** — genel strateji, pazar koşulları, performans öne çıkanları, görünüm
- **Segment raporlaması** — kahve segmenti geliri, kârı, coğrafi dağılım
- **Finansallar** — gelir, kâr, temel oranlar
- **Risk faktörleri** — kahve ve pazara bağlı zorluklar ve fırsatlar
- **Dipnotlar** — önemli işlemler, yatırımlar, muhasebe politikaları
- **KPI'lar** — yılın göstergeleri ve nasıl değiştikleri

**Çıktı:** Kronolojik sıralı `consolidated_timeline.json` — dönemleştirme için tek giriş olarak
hazır, yıl bazı yapılandırılmış kayıt.

### 02 · StrategyAgent — dönemleştirme · analiz · sentez
**Brief Bölüm 1.B — Stratejik Dönem Tespiti ve Analizi**

Brief'in üç adımlı, çoklu oturum yöntemini üç iç geçişle tek bir ajanda uyguluyor.

**Geçiş 1 — Stratejik Dönemleri Tespit Et:** Konsolide zaman çizelgesinden ana dönemleri belirle;
her dönem için başlangıç/bitiş yılları, coğrafi odak, genel strateji, önemli girişimler; geçişleri
açıkla (hangi olaylar/kararlar bir dönemi bitirip yenisini başlattı); her sınırı özetten aldığı
kanıtla destekle.

**Geçiş 2 — Her Dönemi Derinlemesine İncele (izole bağlam):** Coğrafi odak, özgül strateji, finansal
performans (başarılar, zorluklar, trendler); strateji, pazar odağı, ürün teklifi, markalaşmadaki
değişimler; marka ve ürün stratejisinin evrimi; KPI'ların hareketi.

**Geçiş 3 — Sentezle:** Dönem analizlerini Food Empire'in gidişatının tutarlı bir anlatısına dokur
— bir birleştirme değil, bir üst çizgisi olan bir hikaye.

**Çıktı:** `strategic_analysis.json` — dönem zaman çizelgesi + dönem detayları + sentezlenmiş anlatı.

### 03 · MarketDebateAgent — savunma · saldırı · filtreleme · karar
**Brief Bölüm 1.C — Pazar Giriş Önerisi**

İç roller:
- **Savunucu** — her aday pazar için olumlu vakayı oluşturur
- **Muhalif** — her vakaya karşı çıkar: riskler, engeller, başarısızlık senaryoları
- **CFO Filtresi** — giriş maliyeti, geri ödeme süresi ve risk toleransına göre değer biçer

Karar çıktısı: CDSG'nin ilk genişlemesi için net pazar önerisi; hem Food Empire tarihine hem güncel
ortama dayanan gerekçe; kritik başarı faktörleri; azaltma stratejileriyle risk analizi; önerilen
giriş modu (ihracat · ortak girişim · tam sahiplik · franchise) ve gerekçe; Food Empire
playbook'unun CDSG'nin Myanmar tabanına uyarlanması.

**Çıktı:** `market_recommendation.json`

### 04 · CampaignAgent — segmentasyon · konumlandırma · planlama · bütçeleme · ölçüm
**Brief Bölüm 2 — Pazarlama Kampanyası Önerisi**

- **A · Hedef Kitle** — demografik, psikografik, kahve tüketim alışkanlıkları, karşılanmamış
  ihtiyaçlar ve sorun noktaları.
- **B · Değer Önerisi ve Konumlandırma** — farklılık unsuru, konumlandırma ifadesi, çekirdek mesaj,
  Myanmar köken avantajı.
- **C · Pazarlama Karışımı (4P)** — Ürün (formatlar: instant/öğütülmüş/tane/RTD, yerel uyarlama,
  ambalaj, markalaşma); Fiyat (premium/değer/rekabetçi strateji); Yer (en uygun dağıtım kanalları);
  Tanıtım (kanallar, taktikler, çekirdek mesaj, bütçe, yayın takvimi).
- **D · Bütçe ve Zaman Çizelgesi** — gerekçelendirmeli kalem bazlı maliyet + tüm faaliyetlerin Gantt
  grafiği.
- **E · Ölçüm ve Değerlendirme** — KPI seti, ölçüm yöntemleri, hedef/kıyaslamalar, raporlama sıklığı
  ve analiz döngüsü.

**Çıktı:** `campaign_proposal.json`

---

## 05 · Veri Akışı — Durum Nasıl Aktarılıyor?

Her ajan, bir sonraki ajanın bağlamı olan tipli bir JSON artifact üretir. Hiçbir şey serbest metin
olarak aktarılmaz; aşamalar arası sözleşme doğrulanmış bir şemadır.

| Artifact | Üreten ajan | İçerik |
|---|---|---|
| `consolidated_timeline.json` | IntelligenceAgent | Yıl bazı sıkıştırılmış kayıtlar: strateji, pazarlar, finansallar, riskler, KPI'lar |
| `strategic_analysis.json` | StrategyAgent | Dönem zaman çizelgesi, dönem derinlemeleri, geçişler, sentezlenmiş anlatı |
| `market_recommendation.json` | MarketDebateAgent | Puanlanmış adaylar, seçilen pazar, gerekçe, riskler, giriş modu |
| `campaign_proposal.json` | CampaignAgent | Kitle, konumlandırma, 4P, bütçe kalemleri, Gantt verisi, KPI hedefleri |
| `run_state.json` | Orchestrator | Aşama durumu, süreler, token kullanımı, doğrulama kaydı |

**Güvenilirlik Güvencesi:** Her ajan yanıtı şemasına karşı ayrıştırılıyor. Bozuk/eksik yanıtta
Orchestrator düzeltici bir istemle yeniden deniyor; ikinci başarısızlıktan sonra aşamayı inceleme
için durdurarak kötü verinin ilerlemesini engelliyor.

---

## 06 · Teknik Yığın

- **Motor ve ajanlar:** Python · LangGraph · FastAPI · async pools · JSON-schema. LangGraph,
  Orchestrator → ajan zincirini bir durum makinesi olarak modelliyor. FastAPI çalıştırmayı açıyor ve
  ilerlemeyi arayüze aktarıyor.
- **Model katmanı:** LLM API (BYOK) · yeniden deneme · token takibi. Kendi API anahtarınızı getirin
  (BYOK). Aşama bazı token ve gecikme mühendislik görünümünde kaydediliyor.
- **Arayüz:** Next.js · Tailwind · SSE streaming · Framer Motion. SSE canlı "ajan çalışıyor"
  görünümünü sağlıyor; artifact'lar her aşama tamamlandığında görüntüleniyor.
- **Dağıtım:** Vercel · Railway · JSON artifact deposu. Artifact'lar kalıcı olduğu için tamamlanmış
  bir çalıştırma yeniden açılabilir ve dışarı aktarılabilir.

---

## 07 · Arayüz — Vitrin Deneyimi

Web sitesi çalışmayı görünür kılan yerdir. Bir kara kutu değildir — bir izleyici (hocanız dahil)
pipeline'in düşünme sürecini izleyebilir ve ürettiği her artifact'i okuyabilir.

**Ekran Akışı:**
1. **Giriş Sayfası** — BrandOPS'un ne yaptığı, CDSG × Food Empire kurgu, "Pipeline'i Çalıştır".
2. **Canlı Çalıştırma Görünümü** — dikey pipeline olarak dört ajan; her biri aydınlanıyor, durum
   akıtıyor, artifact'ini gerçek zamanlı yayınlıyor.
3. **İstihbarat Raporu** — Food Empire'in kahve işinin yıl bazı kronolojik zaman çizelgesi.
4. **Stratejik Analiz** — geçiş işaretleri ve sentezlenmiş anlatıyla dönem kartları.
5. **Pazar Kararı** — puanlanmış aday pazarlar, seçilen pazar, gerekçe, riskler, giriş modu.
6. **Kampanya** — kitle, konumlandırma, 4P, interaktif bütçe dağılımı, Gantt grafiği, KPI hedefleri.
7. **Mühendislik Kaydı** — mimari, aşama bazı token/gecikme, doğrulama hikayesi.

**Tasarım Dili:** Sıcak editoryal palet (espresso, bakır, krem) · başlıklarda serif, gövdede temiz
sans-serif · sakin hareket (aşamalar belirir, parlayıp sönmez) · her grafik JSON artifact'lardan
beslenir.

---

## 08 · Uyumluluk — Brief Kapsam Haritası (13 Madde)

| # | Brief gereksinimleri | Sağlayan | Ekran |
|---|---|---|---|
| 1 | Tüm yıllık raporların sıkıştırılmış özetleri, kronolojik | IntelligenceAgent | İstihbarat |
| 2 | İsimli, yıllık ve geçişli stratejik dönem zaman çizelgesi | StrategyAgent — Geçiş 1 | Strateji |
| 3 | Dönem bazı detaylı analiz | StrategyAgent — Geçiş 2 | Strateji |
| 4 | Sentezlenmiş, tutarlı anlatı | StrategyAgent — Geçiş 3 | Strateji |
| 5 | Hedef pazar önerisi + gerekçe | MarketDebateAgent | Karar |
| 6 | Kritik başarı faktörleri | MarketDebateAgent | Karar |
| 7 | Risk analizi + azaltma | MarketDebateAgent | Karar |
| 8 | Giriş modu önerisi | MarketDebateAgent | Karar |
| 9 | Hedef kitle tanımı | CampaignAgent — A | Kampanya |
| 10 | Değer önerisi ve konumlandırma | CampaignAgent — B | Kampanya |
| 11 | Pazarlama karışımı (4P) | CampaignAgent — C | Kampanya |
| 12 | Bütçe ve zaman çizelgesi + Gantt grafiği | CampaignAgent — D | Kampanya |
| 13 | KPI'lar, ölçüm ve değerlendirme planı | CampaignAgent — E | Kampanya |

---

## 09 · İnşa Planı — Altı Günlük Yol Haritası

- **Salı — Temel kurulum:** Mimariyi kilitle, Next.js + motor reposunu oluştur, dört JSON şemasını
  tanımla, Vercel'e ilk deploy.
- **Çarşamba — İstihbarat + Strateji artifact'ları:** Food Empire zaman çizelgesini ve stratejik
  dönem analizini üret, doğrula; JSON olarak dondur.
- **Perşembe — Canlı çalıştırma arayüzü:** SSE streaming ve aşama gösterimi olan dört ajanlı pipeline
  görünümünü inşa et.
- **Cuma — Pazar + Kampanya artifact'ları:** Pazar kararını ve tam kampanyayı (4P, bütçe, Gantt, KPI)
  üret; görünümleri oluştur.
- **Cumartesi — Cila + mühendislik kaydı:** Grafikler, animasyonlar, duyarlı düzen, mühendislik
  görünümü ve son deploy.
- **Pazar — Tampon gün:** Brief kapsam haritasına göre gözden geçir, eksiklikleri gider, export
  hazırla.

---

## 10 · Başarı Kriterleri — Tamamlanma Tanımı

**Olması gerekenler:**
- Dört ajanın tamamı şema geçerli artifact üretir
- Brief'teki her teslim arayüzde görüntülenir
- Canlı pipeline çalıştırması başa baş izlenebilir
- Deploy edilmiş ve kamuya açık erişim sağlanıyor

**Olması istenenler:**
- İnteraktif bütçe ve Gantt görselleştirilmesi
- Token ve gecikme istatistikli mühendislik kaydı
- Dışarı aktarılabilir rapor artifact'ları
- Akıcı animasyon ve duyarlı yerleşim

> **Tek Cümleli Perde:** BrandOPS, proje brief'ini izlenebilir bir otonom pipeline'a dönüştürür: dört
> uzman ajan, Food Empire tarihini bir pazar kararına ve CDSG için hazır bir kampanyaya çevirir.
