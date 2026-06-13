"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { PageHeader } from "@/components/Section";
import { usePipeline, StageView } from "@/components/usePipeline";
import PdfUpload from "@/components/PdfUpload";
import { AGENT_META } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "bekliyor", running: "çalışıyor", completed: "tamamlandı",
  needs_review: "inceleme gerekli", failed: "hata",
};

export default function RunPage() {
  const { stages, mode, runId, start } = usePipeline();
  const running = mode === "live" || mode === "demo";
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Canlı Çalıştırma"
        title="Pipeline"
        description="Dört uzman ajan sırayla çalışır; her biri öncekinin doğrulanmış JSON çıktısını tek girdi olarak alır. Aşamalar tamamlandıkça çıktıları belirir."
      />

      {/* PDF Yükleme */}
      <div className="mb-6 rounded-2xl border border-espresso-600/60 bg-espresso-800/40">
        <button
          type="button"
          onClick={() => setUploadOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-espresso-700 text-copper-dark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-cream-100">Yıllık Rapor PDF&apos;leri</p>
              <p className="text-xs text-cream-200/50">
                Pipeline çalışmadan önce analiz edilecek belgeleri yükle
              </p>
            </div>
          </div>
          <motion.span
            animate={{ rotate: uploadOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-cream-200/50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {uploadOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-espresso-600/60 px-5 pb-5 pt-4">
                <PdfUpload />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-8 rounded-2xl border border-emerald-600/30 bg-emerald-50/30 px-5 py-4"
        >
          <p className="text-sm font-medium text-emerald-700">Pipeline tamamlandı.</p>
          <p className="mt-1 text-sm text-cream-200/60">
            Tüm artifact&apos;lar başarıyla üretildi ve doğrulandı. Sonuçlar menüsünden inceleyebilirsin.
          </p>
        </motion.div>
      )}

      {mode === "error" && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-8 rounded-2xl border border-rose-600/30 bg-rose-50/30 px-5 py-4"
        >
          <p className="text-sm font-medium text-rose-700">Bağlantı kesildi.</p>
          <p className="mt-1 text-sm text-cream-200/60">
            Canlı akış koptu. Tamamlanan aşamaların gerçek çıktıları kaydedildi; eksik
            kalan olduysa pipeline&apos;ı tekrar çalıştır. (Sahte/demo veri yazılmadı.)
          </p>
        </motion.div>
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
            done ? "bg-copper text-white" : "bg-espresso-700 text-copper-dark"
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
    running: "text-copper-dark border-copper/50",
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
