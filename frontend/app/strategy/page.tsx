"use client";

import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { PageHeader } from "@/components/Section";
import { useArtifact } from "@/components/useArtifact";
import { Loading, ErrorBox } from "@/components/States";
import { getStrategy } from "@/lib/api";
import type { StrategicAnalysis } from "@/lib/types";

export default function StrategyPage() {
  const { data, error, loading } = useArtifact<StrategicAnalysis>(getStrategy);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Ajan 02 · StrategyAgent"
        title="Stratejik Analiz"
        description="Konsolide zaman çizelgesinden çıkarılan stratejik dönemler, geçiş işaretleri ve hepsini tek bir üst çizgide birleştiren sentez anlatısı."
      />

      {loading && <Loading />}
      {error && <ErrorBox msg={error} />}

      {data && (
        <div className="space-y-10">
          {/* Dönem zaman çizelgesi */}
          <div className="space-y-6">
            {data.periods.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
              >
                {/* Geçiş işareti */}
                {i > 0 && (
                  <div className="mb-4 flex items-center gap-3 text-xs text-cream-200/50">
                    <span className="h-px flex-1 bg-espresso-600" />
                    <span className="font-mono">↓ geçiş</span>
                    <span className="h-px flex-1 bg-espresso-600" />
                  </div>
                )}
                <div className="card p-6 md:p-7">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-2xl">{p.name}</h2>
                    <span className="font-mono text-copper-light">
                      {p.start_year}–{p.end_year}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.geographic_focus.map((g) => (
                      <span key={g} className="pill">{g}</span>
                    ))}
                  </div>
                  <p className="mt-4 text-cream-100/90">{p.strategy}</p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <Transition label="Dönemi başlatan" text={p.transition_in} />
                    <Transition label="Dönemi bitiren" text={p.transition_out} />
                  </div>

                  <div className="mt-5 space-y-4">
                    <Block label="Finansal özet" text={p.financial_summary} />
                    <Block label="Marka & ürün evrimi" text={p.brand_product_evolution} />
                    <Block label="KPI hareketi" text={p.kpi_movement} />
                  </div>

                  {p.initiatives?.length > 0 && (
                    <div className="mt-5">
                      <p className="eyebrow">Önemli girişimler</p>
                      <ul className="mt-2 grid gap-1.5 text-sm text-cream-200/80 sm:grid-cols-2">
                        {p.initiatives.map((it, j) => (
                          <li key={j} className="flex gap-2">
                            <span className="text-copper">•</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Sentez */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="card border-l-2 border-l-copper bg-espresso-800/80 p-7 md:p-9"
          >
            <p className="eyebrow">Sentez · Üst Çizgi</p>
            <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-cream-100">
              {data.synthesis_narrative}
            </p>
          </motion.div>
        </div>
      )}
    </PageTransition>
  );
}

function Transition({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl bg-espresso-900/50 p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 text-sm text-cream-200/80">{text}</p>
    </div>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-cream-200/80">{text}</p>
    </div>
  );
}
