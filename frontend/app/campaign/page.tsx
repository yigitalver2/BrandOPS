"use client";

import PageTransition from "@/components/PageTransition";
import { PageHeader } from "@/components/Section";
import { useArtifact } from "@/components/useArtifact";
import { Loading, ErrorBox } from "@/components/States";
import BudgetChart from "@/components/BudgetChart";
import GanttChart from "@/components/GanttChart";
import { getCampaign } from "@/lib/api";
import type { CampaignProposal } from "@/lib/types";

export default function CampaignPage() {
  const { data, error, loading } = useArtifact<CampaignProposal>(getCampaign);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Ajan 04 · CampaignAgent"
        title="Pazarlama Kampanyası"
        description="Seçilen pazar için eksiksiz, maliyetlendirilmiş kampanya: hedef kitle, konumlandırma, 4P, bütçe, Gantt ve KPI'lar."
      />

      {loading && <Loading />}
      {error && <ErrorBox msg={error} />}

      {data && (
        <div className="space-y-8">
          {/* Konumlandırma vurgusu */}
          <div className="card border-l-2 border-l-copper p-7">
            <p className="eyebrow">Çekirdek Mesaj</p>
            <p className="mt-2 font-display text-2xl text-copper-light md:text-3xl">
              “{data.core_message}”
            </p>
            <p className="mt-4 text-cream-100/90">{data.value_proposition}</p>
            <div className="mt-4 rounded-xl bg-espresso-900/50 p-4">
              <p className="eyebrow">Konumlandırma İfadesi</p>
              <p className="mt-1.5 text-sm italic text-cream-200/80">
                {data.positioning_statement}
              </p>
            </div>
          </div>

          {/* Hedef kitle */}
          <div className="card p-6">
            <p className="eyebrow mb-3">A · Hedef Kitle</p>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Demografik" text={data.target_audience.demographics} />
              <Field label="Psikografik" text={data.target_audience.psychographics} />
              <Field label="Tüketim alışkanlıkları" text={data.target_audience.consumption_habits} />
            </div>
            <div className="mt-4">
              <p className="eyebrow">Karşılanmamış İhtiyaçlar</p>
              <ul className="mt-2 grid gap-1.5 text-sm text-cream-200/85 md:grid-cols-2">
                {data.target_audience.unmet_needs.map((n, i) => (
                  <li key={i} className="flex gap-2"><span className="text-copper">•</span>{n}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 4P */}
          <div>
            <p className="eyebrow mb-3">C · Pazarlama Karışımı (4P)</p>
            <div className="grid gap-4 md:grid-cols-2">
              <P label="Product · Ürün" text={data.marketing_mix.product} />
              <P label="Price · Fiyat" text={data.marketing_mix.price} />
              <P label="Place · Yer" text={data.marketing_mix.place} />
              <P label="Promotion · Tanıtım" text={data.marketing_mix.promotion} />
            </div>
          </div>

          {/* Bütçe + Gantt */}
          <div className="card p-6">
            <p className="eyebrow mb-4">D · Bütçe ve Zaman Çizelgesi</p>
            <BudgetChart budget={data.budget} />
            <div className="mt-8 border-t border-espresso-700/60 pt-6">
              <GanttChart gantt={data.gantt} />
            </div>
          </div>

          {/* KPI'lar */}
          <div className="card p-6">
            <p className="eyebrow mb-3">E · Ölçüm ve Değerlendirme</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-espresso-600 text-cream-200/60">
                    <th className="py-2 pr-4 font-medium">KPI</th>
                    <th className="py-2 pr-4 font-medium">Yöntem</th>
                    <th className="py-2 pr-4 font-medium">Hedef</th>
                    <th className="py-2 font-medium">Sıklık</th>
                  </tr>
                </thead>
                <tbody>
                  {data.kpis.map((k, i) => (
                    <tr key={i} className="border-b border-espresso-700/40">
                      <td className="py-2.5 pr-4 text-cream-100">{k.kpi}</td>
                      <td className="py-2.5 pr-4 text-cream-200/70">{k.method}</td>
                      <td className="py-2.5 pr-4 text-copper-light">{k.target}</td>
                      <td className="py-2.5 text-cream-200/70">{k.cadence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

function Field({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl bg-espresso-900/50 p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 text-sm text-cream-200/80">{text}</p>
    </div>
  );
}

function P({ label, text }: { label: string; text: string }) {
  return (
    <div className="card p-5">
      <p className="font-display text-lg text-copper-light">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-cream-200/80">{text}</p>
    </div>
  );
}
