"use client";

import { useEffect, useState } from "react";
import PageTransition from "@/components/PageTransition";
import { PageHeader } from "@/components/Section";
import { Empty } from "@/components/States";
import { fetchLatestPipelineResults } from "@/lib/api";
import type { MarketRecommendation, MarketCandidate } from "@/lib/types";

const ENTRY_MODE_LABELS: Record<string, string> = {
  export: "Export",
  joint_venture: "Joint Venture",
  wholly_owned: "Wholly Owned",
  franchise: "Franchise",
};

export default function MarketPage() {
  const [data, setData] = useState<MarketRecommendation | null>(null);

  useEffect(() => {
    let alive = true;
    fetchLatestPipelineResults()
      .then((latest) => {
        if (!alive) return;
        const artifact = latest.artifacts.market as MarketRecommendation | undefined;
        if (artifact) setData(artifact);
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem("bo_artifact_market");
          if (raw && alive) setData(JSON.parse(raw));
        } catch {}
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Artifact 03"
        title="Market Recommendation"
        description="Structured debate (bull / bear / CFO) and definitive market decision for CDSG."
        action={
          data && (
            <button onClick={() => window.print()} className="btn-primary print-hidden">
              Download PDF
            </button>
          )
        }
      />

      {!data ? (
        <Empty msg="Not run yet — start the analysis from the Run Pipeline page first." />
      ) : (
        <>
          {/* Karar kartı */}
          <div className="card mb-8 border-l-4 border-l-copper p-6">
            <p className="eyebrow mb-1">Recommended Market</p>
            <h2 className="font-display text-3xl text-cream-100">{data.recommended_market}</h2>
            <span className="mt-3 inline-block rounded-full bg-copper/20 px-3 py-1 font-mono text-xs text-copper-dark">
              {ENTRY_MODE_LABELS[data.entry_mode] ?? data.entry_mode}
            </span>
            <p className="mt-4 leading-relaxed text-cream-200/80">{data.rationale}</p>
            {data.entry_mode_justification && (
              <p className="mt-2 text-sm text-cream-200/60">
                <span className="text-cream-200/40">Entry mode justification · </span>
                {data.entry_mode_justification}
              </p>
            )}
          </div>

          {/* Aday tartışmaları */}
          <p className="eyebrow mb-4">Candidate Market Debate</p>
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {data.candidates.map((c, i) => (
              <CandidateCard key={i} candidate={c} isWinner={c.market === data.recommended_market} />
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Kritik başarı faktörleri */}
            {data.success_factors.length > 0 && (
              <div className="card p-5">
                <p className="eyebrow mb-3">Critical Success Factors</p>
                <ul className="space-y-2 text-sm text-cream-200/70">
                  {data.success_factors.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/60" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Food Empire uyarlamaları */}
            {data.foodempire_adaptations.length > 0 && (
              <div className="card p-5">
                <p className="eyebrow mb-3">Food Empire Playbook Adaptations</p>
                <ul className="space-y-2 text-sm text-cream-200/70">
                  {data.foodempire_adaptations.map((a, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-copper/60" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Riskler tablosu */}
          {data.risks.length > 0 && (
            <div className="card mt-6 p-5">
              <p className="eyebrow mb-4">Risks & Mitigation Strategies</p>
              <div className="space-y-3">
                {data.risks.map((r, i) => (
                  <div key={i} className="grid gap-2 border-b border-espresso-600/30 pb-3 last:border-0 last:pb-0 md:grid-cols-2">
                    <div className="flex gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400/60" />
                      <span className="text-cream-200/80">{r.risk}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/40" />
                      <span className="text-cream-200/60">{r.mitigation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
}

function CandidateCard({ candidate: c, isWinner }: { candidate: MarketCandidate; isWinner: boolean }) {
  return (
    <div className={`card p-5 ${isWinner ? "border-copper/50" : ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg text-cream-100">{c.market}</h3>
        <div className="flex items-center gap-2">
          {isWinner && <span className="pill bg-copper/20 text-copper-dark">Selected</span>}
          <span className="font-mono text-sm text-copper-dark">{c.cfo_score.toFixed(1)}<span className="text-cream-200/30">/10</span></span>
        </div>
      </div>

      {/* CFO skor çubuğu */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-espresso-700">
        <div
          className="h-full rounded-full bg-copper"
          style={{ width: `${(c.cfo_score / 10) * 100}%` }}
        />
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-emerald-400/70">Bull Case</p>
          <p className="text-cream-200/70">{c.bull_case}</p>
        </div>
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-rose-400/70">Bear Case</p>
          <p className="text-cream-200/70">{c.bear_case}</p>
        </div>
      </div>
    </div>
  );
}
