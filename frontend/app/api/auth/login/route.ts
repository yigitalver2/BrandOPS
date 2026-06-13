import { NextResponse } from "next/server";
import { ensureSchema, findUserByEmail } from "@/lib/db";
import { verifyPassword, setSession } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-posta ve şifre gerekli." },
      { status: 400 }
    );
  }

  await ensureSchema();

  const user = await findUserByEmail(email);
  // Kullanıcı sayımını önlemek için aynı genel mesaj.
  const ok = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !ok) {
    return NextResponse.json(
      { error: "E-posta veya şifre hatalı." },
      { status: 401 }
    );
  }

  await setSession({ sub: user.id, email: user.email, name: user.name });
  return NextResponse.json({ ok: true, user: { email: user.email, name: user.name } });
}
