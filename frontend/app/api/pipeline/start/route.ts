import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createPipelineRun, ensureSchema } from "@/lib/db";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Session required." }, { status: 401 });
  }

  await ensureSchema();

  const res = await fetch(`${BACKEND_URL}/run`, { method: "POST" });
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to start pipeline." },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { run_id?: string; status?: string };
  if (!data.run_id) {
    return NextResponse.json(
      { error: "Backend did not return a run_id." },
      { status: 502 }
    );
  }

  await createPipelineRun({
    id: data.run_id,
    createdBy: session.sub,
    status: "running",
  });

  return NextResponse.json({ run_id: data.run_id, status: data.status ?? "started" });
}
