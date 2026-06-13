import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import { AGENT_META, AgentName } from "@/lib/types";

const ORDER: AgentName[] = ["intelligence", "strategy", "market", "campaign"];

export default function Landing() {
  return (
    <>
      <Hero />

      {/* Pipeline özeti — bilgi kartları, link yok */}
      <Reveal className="py-10">
        <p className="eyebrow">Pipeline</p>
        <h2 className="mt-2 text-2xl font-semibold">Dört uzman ajan, doğrulanmış zincir</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {ORDER.map((name, i) => {
            const m = AGENT_META[name];
            return (
              <Reveal key={name} delay={i * 0.08}>
                <div className="card h-full p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-espresso-700 font-mono text-xs text-copper-dark">
                      {m.index}
                    </span>
                    {i < ORDER.length - 1 && (
                      <span className="text-cream-200/50">→</span>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-lg">{m.title}</h3>
                  <p className="mt-1 text-sm text-cream-200/60">{m.subtitle}</p>
                  <p className="mt-3 font-mono text-[11px] text-copper-dark/80">
                    {m.artifact}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Reveal>

      {/* Tez */}
      <Reveal className="card mt-10 border-l-2 border-l-copper p-6 md:p-8">
        <p className="eyebrow">Temel Tez</p>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-cream-100">
          Brief, aslında bir ajan pipeline&apos;ı için bir spesifikasyondur. Yinelemeli
          özetlemeyi, token yönetimi için çoklu oturum izolasyonunu ve her LLM çıktısının
          eleştirel doğrulamasını zaten öngörür. BrandOPS bu spesifikasyonu manuel emek
          yerine <span className="text-copper-dark">yazılım</span> olarak uygular.
        </p>
      </Reveal>
    </>
  );
}
