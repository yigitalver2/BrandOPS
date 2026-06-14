import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  ensureSchema,
  getLatestCompletedPipelineRun,
  getPipelineArtifacts,
  savePipelineArtifact,
} from "@/lib/db";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";

// POST /api/pipeline/translate
// One-time migration: reads the latest completed run from Turso,
// sends all artifacts to the FastAPI /translate endpoint (which uses Claude),
// and writes the English versions back to Turso.
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Session required." }, { status: 401 });
  }

  await ensureSchema();

  const run = await getLatestCompletedPipelineRun();
  if (!run) {
    return NextResponse.json({ error: "No completed pipeline run found in DB." }, { status: 404 });
  }

  const rows = await getPipelineArtifacts(run.id);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No artifacts found for the latest run." }, { status: 404 });
  }

  // Build artifacts map: { agent -> parsed payload }
  const artifacts: Record<string, unknown> = {};
  for (const row of rows) {
    artifacts[row.agent] = JSON.parse(row.payload);
  }

  // Call FastAPI /translate
  const backendRes = await fetch(`${BACKEND_URL}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ artifacts }),
  });

  if (!backendRes.ok) {
    const err = await backendRes.text().catch(() => "unknown error");
    return NextResponse.json(
      { error: `Translation backend failed: ${backendRes.status} — ${err}` },
      { status: 502 }
    );
  }

  const { artifacts: translated } = (await backendRes.json()) as {
    artifacts: Record<string, unknown>;
  };

  // Write translated artifacts back to Turso
  const ARTIFACT_NAMES: Record<string, string> = {
    intelligence: "consolidated_timeline",
    strategy: "strategic_analysis",
    market: "market_recommendation",
    campaign: "campaign_proposal",
  };

  const saved: string[] = [];
  for (const [agent, payload] of Object.entries(translated)) {
    await savePipelineArtifact({
      runId: run.id,
      agent,
      name: ARTIFACT_NAMES[agent] ?? agent,
      payload,
    });
    saved.push(agent);
  }

  return NextResponse.json({ ok: true, runId: run.id, translated: saved });
}
