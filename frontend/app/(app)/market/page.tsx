"use client";

import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { PageHeader } from "@/components/Section";
import { useArtifact } from "@/components/useArtifact";
import { Loading, ErrorBox } from "@/components/States";
import ExportButton from "@/components/ExportButton";
import { getMarket } from "@/lib/api";
import type { MarketRecommendation, EntryMode } from "@/lib/types";

const ENTRY_LABEL: Record<EntryMode, string> = {
  export: "İhracat",
  joint_venture: "Ortak Girişim",
  wholly_owned: "Tam Sahiplik",
  franchise: "Franchise",
};

export default function MarketPage() {
  const { data, error, loading } = useArtifact<MarketRecommendation>(getMarket);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Ajan 03 · MarketDebateAgent"
        title="Pazar Kararı"
        description="Aday pazarların yapılandırılmış tartışması (savunucu / muhalif / CFO filtresi) ve CDSG için tek, savunulabilir pazar önerisi."
        action={<ExportButton data={data} filename="market_recommendation.json" />}
      />

      {loading && <Loading />}
      {error && <ErrorBox msg={error} />}

      {data && (
        <div className="space-y-10">
          {/* Aday pazarlar */}
          <div>
            <p className="eyebrow mb-3">Aday Pazarlar · Çekişmeli Tartışma</p>
            <div className="space-y-4">
              {[...data.candidates]
                .sort((a, b) => b.cfo_score - a.cfo_score)
                .map((c, i) => {
                  const chosen = c.market === data.recommended_market;
                  return (
                    <motion.div
                      key={c.market}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      className={`card p-5 ${
                        chosen ? "border-copper ring-1 ring-copper/40" : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-display text-xl">
                          {c.market}
                          {chosen && (
                            <span className="ml-3 rounded-full bg-copper px-2.5 py-0.5 align-middle text-xs text-cream-50">
                              Seçilen
                            </span>
                          )}
                        </h3>
                        <CfoScore score={c.cfo_score} />
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <Case label="Savunucu · Bull" text={c.bull_case} tone="emerald" />
                        <Case label="Muhalif · Bear" text={c.bear_case} tone="rose" />
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>

          {/* Karar */}
          <div className="card border-l-2 border-l-copper p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Karar</p>
                <h2 className="mt-1 font-display text-3xl text-copper-light">
                  {data.recommended_market}
                </h2>
              </div>
              <div className="text-right">
                <p className="eyebrow">Giriş Modu</p>
                <p className="mt-1 text-xl font-semibold">
                  {ENTRY_LABEL[data.entry_mode]}
                </p>
              </div>
            </div>
            <p className="mt-5 leading-relaxed text-cream-100/90">{data.rationale}</p>
            <div className="mt-4 rounded-xl bg-espresso-900/50 p-4">
              <p className="eyebrow">Giriş modu gerekçesi</p>
              <p className="mt-1.5 text-sm text-cream-200/80">
                {data.entry_mode_justification}
              </p>
            </div>
          </div>

          {/* Başarı faktörleri + riskler */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-6">
              <p className="eyebrow">Kritik Başarı Faktörleri</p>
              <ul className="mt-3 space-y-2 text-sm text-cream-200/85">
                {data.success_factors.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-copper">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-6">
              <p className="eyebrow">Risk Analizi & Azaltma</p>
              <ul className="mt-3 space-y-3 text-sm">
                {data.risks.map((r, i) => (
                  <li key={i}>
                    <p className="text-rose-300/90">⚠ {r.risk}</p>
                    <p className="mt-0.5 pl-4 text-cream-200/70">↳ {r.mitigation}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Food Empire uyarlamaları */}
          <div className="card p-6">
            <p className="eyebrow">Food Empire Playbook&apos;unun CDSG&apos;ye Uyarlanması</p>
            <ul className="mt-3 grid gap-2 text-sm text-cream-200/85 md:grid-cols-2">
              {data.foodempire_adaptations.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-copper">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

function CfoScore({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-espresso-700">
        <div className="h-full rounded-full bg-copper" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-sm">
        <span className="text-copper-light">CFO</span> {score.toFixed(1)}
      </span>
    </div>
  );
}

function Case({ label, text, tone }: { label: string; text: string; tone: "emerald" | "rose" }) {
  const border = tone === "emerald" ? "border-l-emerald-500/50" : "border-l-rose-500/50";
  return (
    <div className={`rounded-xl border-l-2 ${border} bg-espresso-900/40 p-4`}>
      <p className="eyebrow">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-cream-200/80">{text}</p>
    </div>
  );
}
