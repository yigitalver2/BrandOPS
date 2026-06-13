"use client";

import { useEffect, useState } from "react";
import PageTransition from "@/components/PageTransition";
import { PageHeader } from "@/components/Section";
import { TrendBadge } from "@/components/useArtifact";
import { Empty } from "@/components/States";
import type { ConsolidatedTimeline, YearRecord } from "@/lib/types";

export default function IntelligencePage() {
  const [data, setData] = useState<ConsolidatedTimeline | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("bo_artifact_intelligence");
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Artifact 01"
        title="Piyasa İstihbaratı"
        description="Food Empire yıllık raporlarından çıkarılan konsolide zaman çizelgesi."
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
          <div className="mb-6 flex flex-wrap gap-4 text-xs text-cream-200/50">
            <span>Şirket: <b className="text-cream-100">{data.company}</b></span>
            {data.generated_at && (
              <span>Üretildi: <b className="text-cream-100">{new Date(data.generated_at).toLocaleString("tr-TR")}</b></span>
            )}
            <span>Kayıt sayısı: <b className="text-cream-100">{data.records.length}</b></span>
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
        {unavailable && <span className="pill">veri yok</span>}
      </div>

      {unavailable ? (
        <p className="text-sm text-cream-200/50">Bu yıl için rapor erişilemedi.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Finansallar */}
          <div>
            <p className="eyebrow mb-2">Finansallar</p>
            <div className="space-y-1 text-sm">
              {r.financials.revenue != null && (
                <p>Gelir: <b className="text-cream-100">{r.financials.revenue} {r.financials.currency ?? ""}</b></p>
              )}
              {r.financials.profit != null && (
                <p>Kâr: <b className="text-cream-100">{r.financials.profit} {r.financials.currency ?? ""}</b></p>
              )}
              {r.financials.key_ratios.map((kr, i) => (
                <p key={i} className="text-cream-200/60">{kr.name}: <b className="text-cream-100">{kr.value}</b></p>
              ))}
            </div>
          </div>

          {/* Strateji & Pazarlar */}
          <div>
            <p className="eyebrow mb-2">Strateji</p>
            <p className="text-sm leading-relaxed text-cream-200/80">{r.stated_strategy}</p>
            {r.geographic_markets.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {r.geographic_markets.map((m, i) => (
                  <span key={i} className="pill">{m}</span>
                ))}
              </div>
            )}
          </div>

          {/* KPI'lar */}
          {r.kpis.length > 0 && (
            <div>
              <p className="eyebrow mb-2">KPI'lar</p>
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

          {/* Önemli Olaylar */}
          {r.key_events.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Önemli Olaylar</p>
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

          {/* Riskler */}
          {r.risks.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Riskler</p>
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
