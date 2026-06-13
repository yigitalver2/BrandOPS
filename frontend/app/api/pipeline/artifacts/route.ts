import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, savePipelineArtifact } from "@/lib/db";

const ARTIFACT_NAMES: Record<string, string> = {
  intelligence: "consolidated_timeline",
  strategy: "strategic_analysis",
  market: "market_recommendation",
  campaign: "campaign_proposal",
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  let body: {
    runId?: string;
    agent?: string;
    name?: string;
    artifact?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!body.runId || !body.agent || body.artifact == null) {
    return NextResponse.json(
      { error: "runId, agent ve artifact gerekli." },
      { status: 400 }
    );
  }

  const name = body.name || ARTIFACT_NAMES[body.agent];
  if (!name) {
    return NextResponse.json({ error: "Bilinmeyen ajan." }, { status: 400 });
  }

  await ensureSchema();
  await savePipelineArtifact({
    runId: body.runId,
    agent: body.agent,
    name,
    payload: body.artifact,
  });

  return NextResponse.json({ ok: true });
}
