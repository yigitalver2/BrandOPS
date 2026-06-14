import { NextResponse } from "next/server";
import { ensureSchema, findUserByEmail } from "@/lib/db";
import { verifyPassword, setSession } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  await ensureSchema();

  const user = await findUserByEmail(email);
  // Same generic message to prevent user enumeration.
  const ok = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !ok) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 }
    );
  }

  await setSession({ sub: user.id, email: user.email, name: user.name });
  return NextResponse.json({ ok: true, user: { email: user.email, name: user.name } });
}
