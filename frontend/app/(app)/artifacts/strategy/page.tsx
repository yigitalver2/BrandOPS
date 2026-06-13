"use client";

import { useEffect, useState } from "react";
import PageTransition from "@/components/PageTransition";
import { PageHeader } from "@/components/Section";
import { Empty } from "@/components/States";
import { fetchLatestPipelineResults } from "@/lib/api";
import type { StrategicAnalysis, Period } from "@/lib/types";

export default function StrategyPage() {
  const [data, setData] = useState<StrategicAnalysis | null>(null);

  useEffect(() => {
    let alive = true;
    fetchLatestPipelineResults()
      .then((latest) => {
        if (!alive) return;
        const artifact = latest.artifacts.strategy as StrategicAnalysis | undefined;
        if (artifact) setData(artifact);
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem("bo_artifact_strategy");
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
        eyebrow="Artifact 02"
        title="Stratejik Analiz"
        description="Food Empire'in stratejik dönemleri ve sentez anlatısı."
        action={
          data && (
            <button onClick={() => window.print()} className="btn-primary print-hidden">
              PDF İndir
            </button>
          )
        }
      />

      {!data ? (
        <Empty msg="Henüz çalıştırılmadı — önce Pipeline'ı Çalıştır sayfasından analizi başlat." />
      ) : (
        <>
          {/* Sentez anlatısı */}
          <div className="card mb-8 border-l-2 border-l-copper p-6">
            <p className="eyebrow mb-3">Üst Çizgi · Sentez</p>
            <p className="text-lg leading-relaxed text-cream-100">{data.synthesis_narrative}</p>
          </div>

          {/* Dönem sayacı */}
          <div className="mb-4 flex items-baseline gap-2">
            <p className="eyebrow">Stratejik Dönemler</p>
            <span className="font-mono text-xs text-cream-200/40">({data.periods.length} dönem)</span>
          </div>

          {/* Dönemler — dikey zaman çizelgesi */}
          <div className="relative space-y-6 pl-6">
            <div className="absolute left-2 top-0 h-full w-px bg-espresso-600" aria-hidden />
            {data.periods.map((p, i) => (
              <PeriodCard key={i} period={p} index={i} />
            ))}
          </div>
        </>
      )}
    </PageTransition>
  );
}

function PeriodCard({ period: p, index: i }: { period: Period; index: number }) {
  return (
    <div className="card relative p-5">
      {/* Zaman çizelgesi noktası */}
      <div className="absolute -left-[22px] top-6 h-3 w-3 rounded-full border-2 border-copper bg-espresso-900" aria-hidden />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="font-mono text-xs text-copper-dark/70">Dönem {i + 1}</span>
          <h3 className="font-display text-xl text-cream-100">{p.name}</h3>
        </div>
        <span className="pill font-mono">{p.start_year} – {p.end_year}</span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Strateji + coğrafya */}
        <div>
          <p className="eyebrow mb-1.5">Strateji</p>
          <p className="text-sm leading-relaxed text-cream-200/80">{p.strategy}</p>
          {p.geographic_focus.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {p.geographic_focus.map((g, j) => (
                <span key={j} className="pill">{g}</span>
              ))}
            </div>
          )}
        </div>

        {/* Girişimler */}
        {p.initiatives.length > 0 && (
          <div>
            <p className="eyebrow mb-1.5">Girişimler</p>
            <ul className="space-y-1 text-sm text-cream-200/70">
              {p.initiatives.map((init, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-copper/60" />
                  {init}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Finansal özet */}
        {p.financial_summary && (
          <div>
            <p className="eyebrow mb-1.5">Finansal Performans</p>
            <p className="text-sm leading-relaxed text-cream-200/70">{p.financial_summary}</p>
          </div>
        )}

        {/* Marka & ürün evrimi */}
        {p.brand_product_evolution && (
          <div>
            <p className="eyebrow mb-1.5">Marka & Ürün Evrimi</p>
            <p className="text-sm leading-relaxed text-cream-200/70">{p.brand_product_evolution}</p>
          </div>
        )}

        {/* KPI hareketi */}
        {p.kpi_movement && (
          <div className="md:col-span-2">
            <p className="eyebrow mb-1.5">KPI Hareketi</p>
            <p className="text-sm leading-relaxed text-cream-200/70">{p.kpi_movement}</p>
          </div>
        )}
      </div>

      {/* Geçiş */}
      <div className="mt-4 grid gap-2 border-t border-espresso-600/40 pt-4 text-xs text-cream-200/50 md:grid-cols-2">
        {p.transition_in && <p><span className="text-emerald-400/70">→ Giriş:</span> {p.transition_in}</p>}
        {p.transition_out && <p><span className="text-rose-400/70">← Çıkış:</span> {p.transition_out}</p>}
      </div>
    </div>
  );
}
