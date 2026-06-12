"use client";

import { useCallback, useRef, useState } from "react";
import { startRun, streamUrl, getTimeline, getStrategy, getMarket, getCampaign } from "@/lib/api";
import type { AgentName, StageStatus } from "@/lib/types";

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
        // backend erişilemiyor -> demo moduna düş
        setStages(initStages());
        runDemo();
      };
    } catch {
      runDemo();
    }
  }, [runDemo]);

  return { stages, mode, runId, start };
}
