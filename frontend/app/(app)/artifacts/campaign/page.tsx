"use client";

import { useEffect, useState } from "react";
import PageTransition from "@/components/PageTransition";
import { PageHeader } from "@/components/Section";
import { Empty } from "@/components/States";
import BudgetChart from "@/components/BudgetChart";
import GanttChart from "@/components/GanttChart";
import { fetchLatestPipelineResults } from "@/lib/api";
import type { CampaignProposal } from "@/lib/types";

export default function CampaignPage() {
  const [data, setData] = useState<CampaignProposal | null>(null);

  useEffect(() => {
    let alive = true;
    fetchLatestPipelineResults()
      .then((latest) => {
        if (!alive) return;
        const artifact = latest.artifacts.campaign as CampaignProposal | undefined;
        if (artifact) setData(artifact);
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem("bo_artifact_campaign");
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
        eyebrow="Artifact 04"
        title="Campaign Plan"
        description="Target audience, 4Ps, budget and Gantt timeline for CDSG's selected market."
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
        <div className="space-y-6">
          {/* Hedef kitle */}
          <div className="card p-5">
            <p className="eyebrow mb-4">Target Audience</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs text-cream-200/50">Demographics</p>
                <p className="text-sm text-cream-200/80">{data.target_audience.demographics}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-cream-200/50">Psychographics</p>
                <p className="text-sm text-cream-200/80">{data.target_audience.psychographics}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-cream-200/50">Consumption Habits</p>
                <p className="text-sm text-cream-200/80">{data.target_audience.consumption_habits}</p>
              </div>
              {data.target_audience.unmet_needs.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-cream-200/50">Unmet Needs</p>
                  <ul className="space-y-1">
                    {data.target_audience.unmet_needs.map((n, i) => (
                      <li key={i} className="flex gap-2 text-sm text-cream-200/70">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-copper/60" />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Positioning */}
          <div className="card border-l-2 border-l-copper p-5">
            <p className="eyebrow mb-3">Positioning & Message</p>
            <p className="mb-3 leading-relaxed text-cream-100">{data.value_proposition}</p>
            <p className="mb-2 text-sm italic text-cream-200/70">"{data.positioning_statement}"</p>
            <div className="mt-3 inline-block rounded-lg bg-copper/20 px-4 py-2">
              <p className="font-mono text-xs text-cream-200/50">Core Message</p>
              <p className="font-display text-lg text-copper-dark">{data.core_message}</p>
            </div>
          </div>

          {/* 4P */}
          <div>
            <p className="eyebrow mb-3">Marketing Mix (4Ps)</p>
            <div className="grid gap-4 md:grid-cols-2">
              {(["product", "price", "place", "promotion"] as const).map((p) => (
                <div key={p} className="card p-4">
                  <p className="eyebrow mb-2">
                    {p === "product" ? "Product" : p === "price" ? "Price" : p === "place" ? "Place" : "Promotion"}
                  </p>
                  <p className="text-sm leading-relaxed text-cream-200/80">{data.marketing_mix[p]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="card p-5">
            <BudgetChart budget={data.budget} />
            <div className="mt-4 space-y-2 border-t border-espresso-600/40 pt-4">
              {data.budget.line_items.map((li, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] gap-4 text-sm">
                  <div>
                    <span className="text-cream-200/80">{li.name}</span>
                    {li.justification && (
                      <span className="ml-2 text-xs text-cream-200/40">· {li.justification}</span>
                    )}
                  </div>
                  <span className="font-mono text-copper-dark">
                    {li.amount.toLocaleString("en-US")} {data.budget.currency ?? "USD"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gantt */}
          <div className="card p-5">
            <GanttChart gantt={data.gantt} />
          </div>

          {/* KPI table */}
          {data.kpis.length > 0 && (
            <div className="card p-5">
              <p className="eyebrow mb-4">KPI & Measurement Plan</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-espresso-600/40 text-left">
                      <th className="pb-2 pr-4 font-mono text-xs font-normal text-cream-200/40">KPI</th>
                      <th className="pb-2 pr-4 font-mono text-xs font-normal text-cream-200/40">Target</th>
                      <th className="pb-2 pr-4 font-mono text-xs font-normal text-cream-200/40">Method</th>
                      <th className="pb-2 font-mono text-xs font-normal text-cream-200/40">Cadence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.kpis.map((k, i) => (
                      <tr key={i} className="border-b border-espresso-600/20 last:border-0">
                        <td className="py-2 pr-4 text-cream-200/80">{k.kpi}</td>
                        <td className="py-2 pr-4 font-mono text-copper-dark">{k.target}</td>
                        <td className="py-2 pr-4 text-cream-200/60">{k.method}</td>
                        <td className="py-2 text-cream-200/60">{k.cadence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </PageTransition>
  );
}
