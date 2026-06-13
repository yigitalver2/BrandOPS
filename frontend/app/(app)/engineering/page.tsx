"use client";

import PageTransition from "@/components/PageTransition";
import { PageHeader } from "@/components/Section";
import { useArtifact } from "@/components/useArtifact";
import { Loading, ErrorBox } from "@/components/States";
import { getRunState } from "@/lib/api";
import { AGENT_META, AgentName, RunState } from "@/lib/types";

export default function EngineeringPage() {
  const { data, error, loading } = useArtifact<RunState>(getRunState);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Mühendislik Kaydı"
        title="Çalıştığının Kanıtı"
        description="Mimari, aşama bazlı token/gecikme ve doğrulama hikayesi. Her LLM çıktısı şemaya karşı doğrulanır; iki kez başarısız olan aşama insan incelemesi için durdurulur."
      />

      {/* Mimari diyagram */}
      <div className="card mb-8 p-6">
        <p className="eyebrow mb-4">Mimari</p>
        <div className="flex flex-col gap-2 font-mono text-xs text-cream-200/80 md:flex-row md:items-center md:gap-1">
          <Box>Yıllık Raporlar + CDSG Bağlamı</Box>
          <Arrow />
          {(["intelligence", "strategy", "market", "campaign"] as AgentName[]).map((a, i) => (
            <span key={a} className="flex items-center gap-1">
              <Box accent>{AGENT_META[a].title}</Box>
              {i < 3 && <Arrow />}
            </span>
          ))}
          <Arrow />
          <Box>Vitrin Arayüzü</Box>
        </div>
        <p className="mt-4 text-sm text-cream-200/60">
          LangGraph state machine; her ajan öncekinin doğrulanmış JSON&apos;ını tek input alır.
          Orchestrator sırayı, doğrulamayı ve durum aktarımını yönetir.
        </p>
      </div>

      {loading && <Loading />}
      {error && <ErrorBox msg={error} />}

      {data && (
        <>
          {/* Özet metrikler */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Metric label="Toplam Token" value={totalTokens(data).toLocaleString("en-US")} />
            <Metric label="Toplam Süre" value={`${(totalLatency(data) / 1000).toFixed(1)}s`} />
            <Metric
              label="Çalıştırma Durumu"
              value={data.status}
              accent={data.status === "completed"}
            />
          </div>

          {/* Aşama tablosu */}
          <div className="card p-6">
            <p className="eyebrow mb-3">Aşama Bazlı Metrikler</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-espresso-600 text-cream-200/60">
                    <th className="py-2 pr-4 font-medium">Ajan</th>
                    <th className="py-2 pr-4 font-medium">Durum</th>
                    <th className="py-2 pr-4 font-medium">Giriş tok.</th>
                    <th className="py-2 pr-4 font-medium">Çıkış tok.</th>
                    <th className="py-2 pr-4 font-medium">Süre</th>
                    <th className="py-2 pr-4 font-medium">Deneme</th>
                    <th className="py-2 font-medium">Doğrulama</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stages.map((s) => (
                    <tr key={s.agent} className="border-b border-espresso-700/40">
                      <td className="py-2.5 pr-4 text-cream-100">{AGENT_META[s.agent].title}</td>
                      <td className="py-2.5 pr-4 text-cream-200/70">{s.status}</td>
                      <td className="py-2.5 pr-4 font-mono text-cream-200/70">
                        {s.tokens.input.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-cream-200/70">
                        {s.tokens.output.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-cream-200/70">
                        {s.latency_ms != null ? `${(s.latency_ms / 1000).toFixed(1)}s` : "—"}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-cream-200/70">{s.attempts}</td>
                      <td className="py-2.5">
                        {s.validation_passed ? (
                          <span className="text-emerald-400">✓ geçti</span>
                        ) : (
                          <span className="text-rose-300">✗</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card mt-6 border-l-2 border-l-copper p-6">
            <p className="eyebrow">Doğrulama Hikayesi</p>
            <p className="mt-2 text-sm leading-relaxed text-cream-200/80">
              Her ajan yanıtı şemasına karşı ayrıştırılır. Bozuk veya eksik yanıt durumunda
              Orchestrator düzeltici bir istemle yeniden dener (max 2 deneme); ikinci
              başarısızlıktan sonra aşamayı{" "}
              <span className="text-rose-300">needs_review</span> durumuna alıp durdurarak kötü
              verinin ilerlemesini engeller. Bu, brief&apos;in &quot;kapsamlı inceleyin ve
              doğrulayın&quot; talimatının yazılım karşılığıdır.
            </p>
          </div>
        </>
      )}
    </PageTransition>
  );
}

function Box({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`whitespace-nowrap rounded-lg border px-3 py-2 ${
        accent ? "border-copper/50 bg-espresso-700/60 text-copper-light" : "border-espresso-600 bg-espresso-900/50"
      }`}
    >
      {children}
    </span>
  );
}
function Arrow() {
  return <span className="text-espresso-600 md:rotate-0">→</span>;
}
function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card p-5">
      <p className="eyebrow">{label}</p>
      <p className={`mt-2 font-display text-2xl ${accent ? "text-emerald-400" : "text-cream-100"}`}>
        {value}
      </p>
    </div>
  );
}

function totalTokens(rs: RunState) {
  return rs.stages.reduce((a, s) => a + (s.tokens?.total ?? 0), 0);
}
function totalLatency(rs: RunState) {
  return rs.stages.reduce((a, s) => a + (s.latency_ms ?? 0), 0);
}
