"use client";

import { useEffect, useState } from "react";
import PageTransition from "@/components/PageTransition";
import { PageHeader } from "@/components/Section";
import { TrendBadge } from "@/components/useArtifact";
import { Empty } from "@/components/States";
import { fetchLatestPipelineResults } from "@/lib/api";
import type { ConsolidatedTimeline, YearRecord } from "@/lib/types";

export default function IntelligencePage() {
  const [data, setData] = useState<ConsolidatedTimeline | null>(null);

  useEffect(() => {
    let alive = true;
    fetchLatestPipelineResults()
      .then((latest) => {
        if (!alive) return;
        const artifact = latest.artifacts.intelligence as ConsolidatedTimeline | undefined;
        if (artifact) setData(artifact);
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem("bo_artifact_intelligence");
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
        eyebrow="Artifact 01"
        title="Market Intelligence"
        description="Consolidated timeline extracted from Food Empire annual reports."
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
          <div className="mb-6 flex flex-wrap gap-4 text-xs text-cream-200/50">
            <span>Company: <b className="text-cream-100">{data.company}</b></span>
            {data.generated_at && (
              <span>Generated: <b className="text-cream-100">{new Date(data.generated_at).toLocaleString("en-US")}</b></span>
            )}
            <span>Records: <b className="text-cream-100">{data.records.length}</b></span>
          </div>

          <div className="space-y-6">
            {data.records.map((r) => (
              <YearCard key={r.year} record={r} />
            ))}
          </div>
        </>
      )}
    </PageTransition>
  );
}

function YearCard({ record: r }: { record: YearRecord }) {
  const unavailable = r.data_available === false;

  return (
    <div className={`card p-5 ${unavailable ? "opacity-50" : ""}`}>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-2xl font-bold text-copper-dark">{r.year}</span>
        {unavailable && <span className="pill">no data</span>}
      </div>

      {unavailable ? (
        <p className="text-sm text-cream-200/50">Report unavailable for this year.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Financials */}
          <div>
            <p className="eyebrow mb-2">Financials</p>
            <div className="space-y-1 text-sm">
              {r.financials.revenue != null && (
                <p>Revenue: <b className="text-cream-100">{r.financials.revenue} {r.financials.currency ?? ""}</b></p>
              )}
              {r.financials.profit != null && (
                <p>Profit: <b className="text-cream-100">{r.financials.profit} {r.financials.currency ?? ""}</b></p>
              )}
              {r.financials.key_ratios.map((kr, i) => (
                <p key={i} className="text-cream-200/60">{kr.name}: <b className="text-cream-100">{kr.value}</b></p>
              ))}
            </div>
          </div>

          {/* Strategy & Markets */}
          <div>
            <p className="eyebrow mb-2">Strategy</p>
            <p className="text-sm leading-relaxed text-cream-200/80">{r.stated_strategy}</p>
            {r.geographic_markets.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {r.geographic_markets.map((m, i) => (
                  <span key={i} className="pill">{m}</span>
                ))}
              </div>
            )}
          </div>

          {/* KPIs */}
          {r.kpis.length > 0 && (
            <div>
              <p className="eyebrow mb-2">KPIs</p>
              <div className="space-y-1">
                {r.kpis.map((k, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-cream-200/70">{k.name}</span>
                    <span className="flex items-center gap-1.5">
                      <b className="text-cream-100">{k.value}</b>
                      <TrendBadge trend={k.trend} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Events */}
          {r.key_events.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Key Events</p>
              <ul className="space-y-1 text-sm text-cream-200/70">
                {r.key_events.map((e, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-copper/60" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks */}
          {r.risks.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Risks</p>
              <ul className="space-y-1 text-sm text-cream-200/70">
                {r.risks.map((risk, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400/60" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
