// Veri katmanı — önce mock (public/mock/*.json), sonra gerçek API.
// Mod (b): donmuş, doğrulanmış artifact'lar mock olarak servis edilir; canlı çalıştırma
// backend SSE'ye bağlanır.

import type {
  ConsolidatedTimeline,
  StrategicAnalysis,
  MarketRecommendation,
  CampaignProposal,
  RunState,
} from "./types";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function loadMock<T>(name: string): Promise<T> {
  const res = await fetch(`/mock/${name}.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`mock yüklenemedi: ${name}`);
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

// --- Canlı çalıştırma (gerçek backend) ---
export async function startRun(): Promise<{ run_id: string }> {
  const res = await fetch(`${BACKEND_URL}/run`, { method: "POST" });
  if (!res.ok) throw new Error("çalıştırma başlatılamadı");
  return res.json();
}

export function streamUrl(runId: string): string {
  return `${BACKEND_URL}/run/${runId}/stream`;
}
