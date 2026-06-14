import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  ensureSchema,
  getLatestCompletedPipelineRun,
  getPipelineArtifacts,
} from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Session required." }, { status: 401 });
  }

  await ensureSchema();

  const run = await getLatestCompletedPipelineRun();
  if (!run) {
    return NextResponse.json({ run: null, artifacts: {} });
  }

  const rows = await getPipelineArtifacts(run.id);
  const artifacts = Object.fromEntries(
    rows.map((row) => [row.agent, JSON.parse(row.payload)])
  );

  return NextResponse.json({
    run: {
      id: run.id,
      status: run.status,
      started_at: run.started_at,
      finished_at: run.finished_at,
      latest_event_at: run.latest_event_at,
    },
    artifacts,
  });
}
