// Data layer — mock first (public/mock/*.json), then real API.
// Demo mode: frozen, validated artifacts are served as mock; live run connects to backend SSE.

import type {
  ConsolidatedTimeline,
  StrategicAnalysis,
  MarketRecommendation,
  CampaignProposal,
  RunState,
  AgentName,
} from "./types";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function loadMock<T>(name: string): Promise<T> {
  const res = await fetch(`/mock/${name}.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`failed to load mock: ${name}`);
  return res.json();
}

export const getTimeline = () =>
  loadMock<ConsolidatedTimeline>("consolidated_timeline");
export const getStrategy = () =>
  loadMock<StrategicAnalysis>("strategic_analysis");
export const getMarket = () =>
  loadMock<MarketRecommendation>("market_recommendation");
export const getCampaign = () =>
  loadMock<CampaignProposal>("campaign_proposal");
export const getRunState = () => loadMock<RunState>("run_state");

// --- Live run (real backend) ---
export async function startRun(): Promise<{ run_id: string }> {
  const res = await fetch("/api/pipeline/start", { method: "POST" });
  if (!res.ok) throw new Error("failed to start run");
  return res.json();
}

export function streamUrl(runId: string): string {
  return `${BACKEND_URL}/run/${runId}/stream`;
}

// --- Fetch run artifacts from backend ---
export async function fetchArtifact(runId: string, name: string): Promise<unknown> {
  const res = await fetch(`${BACKEND_URL}/run/${runId}/artifact/${name}`);
  if (!res.ok) throw new Error(`could not fetch artifact: ${name}`);
  return res.json();
}

// Fetch live run status (used for polling when SSE drops).
export async function fetchRunStatus(runId: string): Promise<RunState> {
  const res = await fetch(`${BACKEND_URL}/run/${runId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("could not fetch run status");
  return res.json();
}

export async function savePipelineArtifact(input: {
  runId: string;
  agent: AgentName;
  name: string;
  artifact: unknown;
}): Promise<void> {
  const res = await fetch("/api/pipeline/artifacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("failed to write artifact to DB");
}

export async function finishPipelineRun(input: {
  runId: string;
  status: "completed" | "failed" | "needs_review";
}): Promise<void> {
  const res = await fetch("/api/pipeline/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("failed to write run status to DB");
}

export async function fetchLatestPipelineResults(): Promise<{
  run: null | {
    id: string;
    status: string;
    started_at: number;
    finished_at: number | null;
    latest_event_at: number;
  };
  artifacts: Partial<Record<AgentName, unknown>>;
}> {
  const res = await fetch("/api/pipeline/latest", { cache: "no-store" });
  if (!res.ok) throw new Error("could not fetch latest pipeline results");
  return res.json();
}

// --- PDF management ---
export async function listReports(): Promise<{ reports: string[]; count: number }> {
  const res = await fetch(`${BACKEND_URL}/reports`);
  if (!res.ok) throw new Error("could not fetch report list");
  return res.json();
}

export async function uploadReport(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ ok: boolean; filename: string; size: number }> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BACKEND_URL}/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress((e.loaded / e.total) * 100);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try { reject(new Error(JSON.parse(xhr.responseText).detail || "Upload failed")); }
        catch { reject(new Error("Upload failed")); }
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(fd);
  });
}

export async function deleteReport(filename: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/reports/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("delete failed");
}
