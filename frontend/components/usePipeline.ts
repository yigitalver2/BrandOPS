"use client";

import { useCallback, useRef, useState } from "react";
import {
  startRun, streamUrl, getTimeline, getStrategy, getMarket, getCampaign,
  fetchArtifact, fetchRunStatus,
} from "@/lib/api";
import type { AgentName, StageStatus } from "@/lib/types";

const ARTIFACT_NAME: Record<AgentName, string> = {
  intelligence: "consolidated_timeline",
  strategy: "strategic_analysis",
  market: "market_recommendation",
  campaign: "campaign_proposal",
};

const ORDER: AgentName[] = ["intelligence", "strategy", "market", "campaign"];

export interface StageView {
  agent: AgentName;
  status: StageStatus;
  tokens?: { input: number; output: number; total: number };
  latency_ms?: number;
  artifact?: unknown;
  error?: string;
}

type RunMode = "idle" | "live" | "demo" | "done" | "error";

function initStages(): StageView[] {
  return ORDER.map((agent) => ({ agent, status: "pending" }));
}

// Canlı çalıştırma: backend SSE'ye bağlanır. Backend yoksa "demo" moduna düşer:
// donmuş artifact'ları sırayla, sakin gecikmeyle açar (mod b akış efekti).
export function usePipeline() {
  const [stages, setStages] = useState<StageView[]>(initStages);
  const [mode, setMode] = useState<RunMode>("idle");
  const [runId, setRunId] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const patch = (agent: AgentName, p: Partial<StageView>) =>
    setStages((prev) => prev.map((s) => (s.agent === agent ? { ...s, ...p } : s)));

  // Demo akışı: SADECE backend hiç erişilemediğinde, run sayfasında "demo" etiketiyle
  // gösterilir. localStorage'a YAZMAZ — artifact sayfalarına sahte veri sızmaz.
  const runDemo = useCallback(async () => {
    setMode("demo");
    const loaders = { intelligence: getTimeline, strategy: getStrategy, market: getMarket, campaign: getCampaign };
    for (const agent of ORDER) {
      patch(agent, { status: "running" });
      await new Promise((r) => setTimeout(r, 1400));
      const artifact = await loaders[agent]().catch(() => undefined);
      patch(agent, { status: "completed", artifact, latency_ms: 1400 });
    }
    setMode("done");
  }, []);

  // SSE koptuğunda: backend'i poll'le, pipeline bitene kadar bekle, GERÇEK
  // artifact'ları çek. Demo'ya düşmez — uzun çalışmalarda tek güvenilir yol bu.
  const recoverFromBackend = useCallback(async (rid: string) => {
    const DEADLINE = Date.now() + 30 * 60_000; // en fazla 30 dk bekle
    while (Date.now() < DEADLINE) {
      let run;
      try {
        run = await fetchRunStatus(rid);
      } catch {
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      // Tamamlanan aşamaların artifact'larını çek + kaydet
      for (const st of run.stages) {
        if (st.status === "completed") {
          const data = await fetchArtifact(rid, ARTIFACT_NAME[st.agent]).catch(() => null);
          if (data) {
            try { localStorage.setItem(`bo_artifact_${st.agent}`, JSON.stringify(data)); } catch {}
            patch(st.agent, { status: "completed", artifact: data, tokens: st.tokens, latency_ms: st.latency_ms ?? undefined });
          }
        } else if (st.status === "running") {
          patch(st.agent, { status: "running" });
        } else if (st.status === "failed" || st.status === "needs_review") {
          patch(st.agent, { status: st.status, error: st.error ?? undefined });
        }
      }
      if (["completed", "failed", "needs_review"].includes(run.status)) {
        setMode(run.status === "completed" ? "done" : "error");
        return;
      }
      await new Promise((r) => setTimeout(r, 5000)); // 5sn'de bir yokla
    }
    setMode("error");
  }, []);

  const start = useCallback(async () => {
    setStages(initStages());
    setMode("live");
    try {
      const { run_id } = await startRun();
      setRunId(run_id);
      const es = new EventSource(streamUrl(run_id));
      esRef.current = es;

      es.addEventListener("stage_started", (e) => {
        const d = JSON.parse((e as MessageEvent).data);
        patch(d.agent, { status: "running" });
      });
      es.addEventListener("stage_completed", (e) => {
        const d = JSON.parse((e as MessageEvent).data);
        patch(d.agent, {
          status: "completed", artifact: d.artifact,
          tokens: d.tokens, latency_ms: d.latency_ms,
        });
        try { localStorage.setItem(`bo_artifact_${d.agent}`, JSON.stringify(d.artifact)); } catch {}
      });
      es.addEventListener("stage_failed", (e) => {
        const d = JSON.parse((e as MessageEvent).data);
        patch(d.agent, { status: "needs_review", error: (d.errors || []).join("; ") });
      });
      es.addEventListener("run_finished", () => {
        es.close();
        setMode("done");
      });
      es.onerror = () => {
        es.close();
        // SSE koptu (uzun aşamada proxy timeout olabilir). Backend'den GERÇEK
        // artifact'ları çekmeyi dene. Demo verisine ASLA düşme — pipeline
        // backend'de hâlâ çalışıyor olabilir, sahte veri yazmak yanıltıcı olur.
        recoverFromBackend(run_id);
      };
    } catch {
      runDemo();
    }
  }, [runDemo, recoverFromBackend]);

  return { stages, mode, runId, start };
}
