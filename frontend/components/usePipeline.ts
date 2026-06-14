"use client";

import { useCallback, useRef, useState } from "react";
import {
  startRun, streamUrl, getTimeline, getStrategy, getMarket, getCampaign,
  fetchArtifact, fetchRunStatus, savePipelineArtifact, finishPipelineRun,
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

// Live run: connects to backend SSE. Falls back to "demo" mode if backend is unreachable:
// replays frozen artifacts sequentially with a short delay (simulated stream effect).
export function usePipeline() {
  const [stages, setStages] = useState<StageView[]>(initStages);
  const [mode, setMode] = useState<RunMode>("idle");
  const [runId, setRunId] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const saveTasksRef = useRef<Promise<void>[]>([]);

  const patch = (agent: AgentName, p: Partial<StageView>) =>
    setStages((prev) => prev.map((s) => (s.agent === agent ? { ...s, ...p } : s)));

  // Demo flow: only used when backend is completely unreachable; shown with a "demo" label
  // on the run page. Does NOT write to localStorage — prevents fake data leaking to artifact pages.
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

  // When SSE drops: poll the backend until the pipeline finishes, then fetch real artifacts.
  // Never falls back to demo — polling is the only reliable path for long-running stages.
  const recoverFromBackend = useCallback(async (rid: string) => {
    const DEADLINE = Date.now() + 30 * 60_000; // wait at most 30 min
    while (Date.now() < DEADLINE) {
      let run;
      try {
        run = await fetchRunStatus(rid);
      } catch {
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      // Fetch + save artifacts for completed stages
      for (const st of run.stages) {
        if (st.status === "completed") {
          const data = await fetchArtifact(rid, ARTIFACT_NAME[st.agent]).catch(() => null);
          if (data) {
            try { localStorage.setItem(`bo_artifact_${st.agent}`, JSON.stringify(data)); } catch {}
            const saveTask = savePipelineArtifact({
              runId: rid,
              agent: st.agent,
              name: ARTIFACT_NAME[st.agent],
              artifact: data,
            }).catch(() => {});
            saveTasksRef.current.push(saveTask);
            await saveTask;
            patch(st.agent, { status: "completed", artifact: data, tokens: st.tokens, latency_ms: st.latency_ms ?? undefined });
          }
        } else if (st.status === "running") {
          patch(st.agent, { status: "running" });
        } else if (st.status === "failed" || st.status === "needs_review") {
          patch(st.agent, { status: st.status, error: st.error ?? undefined });
        }
      }
      if (["completed", "failed", "needs_review"].includes(run.status)) {
        await Promise.allSettled(saveTasksRef.current);
        finishPipelineRun({
          runId: rid,
          status: run.status as "completed" | "failed" | "needs_review",
        }).catch(() => {});
        setMode(run.status === "completed" ? "done" : "error");
        return;
      }
      await new Promise((r) => setTimeout(r, 5000)); // poll every 5s
    }
    setMode("error");
  }, []);

  const start = useCallback(async () => {
    setStages(initStages());
    setMode("live");
    try {
      saveTasksRef.current = [];
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
        const saveTask = savePipelineArtifact({
          runId: run_id,
          agent: d.agent,
          name: ARTIFACT_NAME[d.agent as AgentName],
          artifact: d.artifact,
        }).catch(() => {});
        saveTasksRef.current.push(saveTask);
      });
      es.addEventListener("stage_failed", (e) => {
        const d = JSON.parse((e as MessageEvent).data);
        patch(d.agent, { status: "needs_review", error: (d.errors || []).join("; ") });
      });
      es.addEventListener("run_finished", async (e) => {
        const d = JSON.parse((e as MessageEvent).data) as {
          status?: "completed" | "failed" | "needs_review";
        };
        const status = d.status ?? "completed";
        es.close();
        await Promise.allSettled(saveTasksRef.current);
        finishPipelineRun({ runId: run_id, status }).catch(() => {});
        setMode(status === "completed" ? "done" : "error");
      });
      es.onerror = () => {
        es.close();
        // SSE dropped (likely a proxy timeout on a long stage). Try to fetch real
        // artifacts from the backend. Never fall back to demo — the pipeline may still
        // be running on the backend and writing fake data would be misleading.
        recoverFromBackend(run_id);
      };
    } catch {
      runDemo();
    }
  }, [runDemo, recoverFromBackend]);

  return { stages, mode, runId, start };
}
