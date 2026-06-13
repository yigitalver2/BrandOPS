import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureSchema, finishPipelineRun } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  let body: { runId?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (
    !body.runId ||
    !["completed", "failed", "needs_review"].includes(body.status ?? "")
  ) {
    return NextResponse.json(
      { error: "runId ve geçerli status gerekli." },
      { status: 400 }
    );
  }

  await ensureSchema();
  await finishPipelineRun({
    runId: body.runId,
    status: body.status as "completed" | "failed" | "needs_review",
  });

  return NextResponse.json({ ok: true });
}
