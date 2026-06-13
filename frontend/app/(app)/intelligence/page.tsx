"use client";

import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { PageHeader } from "@/components/Section";
import { useArtifact, TrendBadge } from "@/components/useArtifact";
import { Loading, ErrorBox } from "@/components/States";
import ExportButton from "@/components/ExportButton";
import { getTimeline } from "@/lib/api";
import type { ConsolidatedTimeline } from "@/lib/types";

export default function IntelligencePage() {
  const { data, error, loading } = useArtifact<ConsolidatedTimeline>(getTimeline);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Ajan 01 · IntelligenceAgent"
        title="İstihbarat Raporu"
        description="Food Empire'in kahve işinin yıl bazlı kronolojik zaman çizelgesi — yıllık raporların hedefli çıkarım ve iteratif özetlemeyle sıkıştırılmış hâli."
        action={<ExportButton data={data} filename="consolidated_timeline.json" />}
      />

      {loading && <Loading />}
      {error && <ErrorBox msg={error} />}

      {data && (
        <div className="space-y-6">
          <p className="text-sm text-cream-200/60">
            {data.company} · {data.records.length} yıl
          </p>
          <ol className="relative space-y-8 border-l border-espresso-600 pl-6">
            {data.records.map((r, i) => (
              <motion.li
                key={r.year}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="relative"
              >
                <span className="absolute -left-[31px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-copper ring-4 ring-espresso-900" />
                <div className="card p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2 className="font-display text-3xl text-copper-light">{r.year}</h2>
                    <div className="flex flex-wrap gap-2">
                      {r.geographic_markets.slice(0, 5).map((m) => (
                        <span key={m} className="pill">{m}</span>
                      ))}
                    </div>
                  </div>

                  <p className="mt-4 text-cream-100/90">{r.stated_strategy}</p>

                  {/* Finansallar */}
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-espresso-900/50 p-4">
                      <p className="eyebrow">Finansallar</p>
                      <div className="mt-2 flex gap-6">
                        <div>
                          <p className="text-2xl font-semibold">
                            {fmt(r.financials.revenue)}
                          </p>
                          <p className="text-xs text-cream-200/50">
                            Gelir {r.financials.currency ? `(${r.financials.currency})` : ""}
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{fmt(r.financials.profit)}</p>
                          <p className="text-xs text-cream-200/50">Kâr</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-cream-200/70">
                        {r.financials.key_ratios.map((kr) => (
                          <span key={kr.name}>
                            {kr.name}: <b className="text-cream-100">{kr.value}</b>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* KPI'lar */}
                    <div className="rounded-xl bg-espresso-900/50 p-4">
                      <p className="eyebrow">KPI&apos;lar</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {r.kpis.slice(0, 5).map((k) => (
                          <li key={k.name} className="flex items-center justify-between gap-2">
                            <span className="text-cream-200/70">{k.name}</span>
                            <span className="flex items-center gap-1">
                              <span className="text-cream-100">{k.value}</span>
                              <TrendBadge trend={k.trend} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Olaylar + riskler */}
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Detail title="Önemli olaylar" items={r.key_events} />
                    <Detail title="Riskler" items={r.risks} accent="rose" />
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      )}
    </PageTransition>
  );
}

function Detail({
  title, items, accent,
}: { title: string; items: string[]; accent?: "rose" }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-cream-200/80">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className={accent === "rose" ? "text-rose-400/70" : "text-copper"}>•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function fmt(v: number | string | null) {
  if (v === null || v === undefined) return "—";
  return typeof v === "number" ? v.toLocaleString("en-US") : v;
}
