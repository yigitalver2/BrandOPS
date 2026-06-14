import { NextResponse } from "next/server";
import { ensureSchema, findUserByEmail, createUser } from "@/lib/db";
import { hashPassword, setSession } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const name = (body.name || "").trim() || null;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  await ensureSchema();

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "This email is already registered." },
      { status: 409 }
    );
  }

  const id = "usr_" + crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await createUser({ id, email, passwordHash, name });
  await setSession({ sub: id, email, name });

  return NextResponse.json({ ok: true, user: { email, name } }, { status: 201 });
}
