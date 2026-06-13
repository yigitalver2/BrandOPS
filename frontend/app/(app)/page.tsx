import Link from "next/link";
import PageTransition from "@/components/PageTransition";
import { AGENT_META, AgentName } from "@/lib/types";

const ORDER: AgentName[] = ["intelligence", "strategy", "market", "campaign"];

export default function Landing() {
  return (
    <PageTransition>
      {/* Hero */}
      <section className="py-12 md:py-20">
        <p className="eyebrow">Ürün · Otonom Strateji Motoru</p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl font-bold leading-[1.05] md:text-7xl">
          Pazar girişi stratejisi ve{" "}
          <span className="text-copper-light">kampanya tasarımı</span> için otonom bir motor.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-cream-200/70">
          BrandOPS, CDSG × Food Empire danışmanlık brief&apos;ini eksiksiz bir çok-ajanlı
          pipeline&apos;a dönüştürür. Yıllık raporları analiz eder, stratejik dönemi
          haritalar, hedef pazarı tartışarak seçer ve tam bir pazarlama kampanyası üretir.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/run" className="btn-primary">
            Pipeline&apos;i Çalıştır →
          </Link>
          <Link
            href="/intelligence"
            className="inline-flex items-center rounded-full border border-espresso-600 px-6 py-3 text-cream-100 transition-colors hover:border-copper"
          >
            Çıktıları İncele
          </Link>
        </div>
      </section>

      {/* Pipeline özeti */}
      <section className="py-10">
        <p className="eyebrow">Pipeline</p>
        <h2 className="mt-2 text-2xl font-semibold">Dört uzman ajan, doğrulanmış zincir</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {ORDER.map((name, i) => {
            const m = AGENT_META[name];
            return (
              <Link
                key={name}
                href={m.href}
                className="card group p-5 transition-colors hover:border-copper/60"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-espresso-700 font-mono text-xs text-copper-light">
                    {m.index}
                  </span>
                  {i < ORDER.length - 1 && (
                    <span className="text-espresso-600 group-hover:text-copper">↓</span>
                  )}
                </div>
                <h3 className="mt-3 font-display text-lg">{m.title}</h3>
                <p className="mt-1 text-sm text-cream-200/60">{m.subtitle}</p>
                <p className="mt-3 font-mono text-[11px] text-copper-light/80">
                  {m.artifact}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Tez */}
      <section className="card mt-10 border-l-2 border-l-copper p-6 md:p-8">
        <p className="eyebrow">Temel Tez</p>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-cream-100">
          Brief, aslında bir ajan pipeline&apos;ı için bir spesifikasyondur. Yinelemeli
          özetlemeyi, token yönetimi için çoklu oturum izolasyonunu ve her LLM çıktısının
          eleştirel doğrulamasını zaten öngörür. BrandOPS bu spesifikasyonu manuel emek
          yerine <span className="text-copper-light">yazılım</span> olarak uygular.
        </p>
      </section>
    </PageTransition>
  );
}
