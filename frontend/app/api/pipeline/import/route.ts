import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  ensureSchema,
  createPipelineRun,
  savePipelineArtifact,
  finishPipelineRun,
} from "@/lib/db";

// POST /api/pipeline/import
// Imports a translated artifact set into the DB, creating the run row if needed.
// Body: { runId, artifacts: { intelligence?, strategy?, market?, campaign? } }
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Session required." }, { status: 401 });
  }

  let body: {
    runId?: string;
    artifacts?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.runId || !body.artifacts || typeof body.artifacts !== "object") {
    return NextResponse.json(
      { error: "runId and artifacts are required." },
      { status: 400 }
    );
  }

  const ARTIFACT_NAMES: Record<string, string> = {
    intelligence: "consolidated_timeline",
    strategy: "strategic_analysis",
    market: "market_recommendation",
    campaign: "campaign_proposal",
  };

  await ensureSchema();

  // Create the run row (INSERT OR IGNORE so re-running is safe)
  await createPipelineRun({
    id: body.runId,
    createdBy: session.sub,
    status: "running",
  }).catch(() => {
    // Row may already exist — ignore
  });

  const saved: string[] = [];

  for (const [agent, artifact] of Object.entries(body.artifacts)) {
    const name = ARTIFACT_NAMES[agent];
    if (!name || artifact == null) continue;
    await savePipelineArtifact({
      runId: body.runId,
      agent,
      name,
      payload: artifact,
    });
    saved.push(agent);
  }

  // Mark run as completed
  await finishPipelineRun({
    runId: body.runId,
    status: "completed",
  }).catch(() => {});

  return NextResponse.json({ ok: true, runId: body.runId, saved });
}
