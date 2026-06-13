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

// --- PDF yönetimi ---
export async function listReports(): Promise<{ reports: string[]; count: number }> {
  const res = await fetch(`${BACKEND_URL}/reports`);
  if (!res.ok) throw new Error("rapor listesi alınamadı");
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
        try { reject(new Error(JSON.parse(xhr.responseText).detail || "Yükleme hatası")); }
        catch { reject(new Error("Yükleme hatası")); }
      }
    };
    xhr.onerror = () => reject(new Error("Ağ hatası"));
    xhr.send(fd);
  });
}

export async function deleteReport(filename: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/reports/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("silme hatası");
}
