"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { PageHeader } from "@/components/Section";
import { usePipeline, StageView } from "@/components/usePipeline";
import { AGENT_META } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "bekliyor", running: "çalışıyor", completed: "tamamlandı",
  needs_review: "inceleme gerekli", failed: "hata",
};

export default function RunPage() {
  const { stages, mode, runId, start } = usePipeline();
  const running = mode === "live" || mode === "demo";

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Canlı Çalıştırma"
        title="Pipeline"
        description="Dört uzman ajan sırayla çalışır; her biri öncekinin doğrulanmış JSON çıktısını tek girdi olarak alır. Aşamalar tamamlandıkça çıktıları belirir."
      />

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <button onClick={start} disabled={running} className="btn-primary disabled:opacity-50">
          {running ? "Çalışıyor…" : mode === "done" ? "Tekrar Çalıştır" : "Pipeline'i Çalıştır →"}
        </button>
        {runId && <span className="font-mono text-xs text-cream-200/50">run: {runId}</span>}
        {mode === "demo" && (
          <span className="pill">demo akışı (donmuş, doğrulanmış artifact&apos;lar)</span>
        )}
      </div>

      {/* Dikey pipeline */}
      <div className="space-y-4">
        {stages.map((s, i) => (
          <div key={s.agent}>
            {i > 0 && (
              <div className="ml-6 h-6 w-px bg-espresso-600" aria-hidden />
            )}
            <StageCard stage={s} />
          </div>
        ))}
      </div>

      {mode === "done" && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-8 text-sm text-cream-200/60"
        >
          Pipeline tamamlandı. Her artifact&apos;ı ayrı görünümlerde inceleyebilirsiniz:{" "}
          <Link href="/intelligence" className="text-copper-light hover:underline">İstihbarat</Link>,{" "}
          <Link href="/strategy" className="text-copper-light hover:underline">Strateji</Link>,{" "}
          <Link href="/market" className="text-copper-light hover:underline">Karar</Link>,{" "}
          <Link href="/campaign" className="text-copper-light hover:underline">Kampanya</Link>.
        </motion.p>
      )}
    </PageTransition>
  );
}

function StageCard({ stage }: { stage: StageView }) {
  const m = AGENT_META[stage.agent];
  const running = stage.status === "running";
  const done = stage.status === "completed";
  const bad = stage.status === "needs_review" || stage.status === "failed";

  return (
    <motion.div
      layout
      className={`card p-5 transition-colors ${
        running ? "border-copper/60" : done ? "border-emerald-600/30" : bad ? "border-rose-600/40" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`grid h-10 w-10 place-items-center rounded-lg font-mono text-sm ${
            done ? "bg-copper text-cream-50" : "bg-espresso-700 text-copper-light"
          }`}
        >
          {m.index}
        </span>
        <div className="flex-1">
          <h3 className="font-display text-lg">{m.title}</h3>
          <p className="text-xs text-cream-200/50">{m.subtitle} · {m.artifact}</p>
        </div>
        <StatusPill status={stage.status} />
      </div>

      {/* Çalışırken ince ilerleme çizgisi */}
      {running && (
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-espresso-700">
          <motion.div
            className="h-full bg-copper"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            style={{ width: "40%" }}
          />
        </div>
      )}

      {/* Stage reveal — sakin geçiş */}
      <AnimatePresence>
        {done && stage.artifact != null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mt-4 overflow-hidden"
          >
            <div className="flex flex-wrap gap-4 text-xs text-cream-200/60">
              {stage.tokens && (
                <span>token: <b className="text-cream-100">{stage.tokens.total.toLocaleString()}</b></span>
              )}
              {stage.latency_ms != null && (
                <span>süre: <b className="text-cream-100">{(stage.latency_ms / 1000).toFixed(1)}s</b></span>
              )}
              <span className="text-emerald-400/80">✓ şema doğrulandı</span>
            </div>
            <pre className="mt-3 max-h-44 overflow-auto rounded-lg bg-espresso-900/70 p-3 font-mono text-[11px] text-cream-200/70">
              {preview(stage.artifact)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {bad && stage.error && (
        <p className="mt-3 text-sm text-rose-300">{stage.error}</p>
      )}
    </motion.div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    pending: "text-cream-200/40 border-espresso-600",
    running: "text-copper-light border-copper/50",
    completed: "text-emerald-400 border-emerald-600/40",
    needs_review: "text-rose-300 border-rose-600/40",
    failed: "text-rose-300 border-rose-600/40",
  };
  return (
    <span className={`rounded-full border px-3 py-1 text-xs ${cls[status] ?? cls.pending}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function preview(obj: unknown): string {
  const s = JSON.stringify(obj, null, 2);
  return s.length > 1400 ? s.slice(0, 1400) + "\n…" : s;
}
