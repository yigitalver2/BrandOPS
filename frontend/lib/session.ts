import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// jose tabanlı oturum token'ı — Edge runtime'da (middleware) de çalışır.
// Üretimde AUTH_SECRET mutlaka ayarlanmalı; lokal için güvenli olmayan varsayılan.
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me-in-prod"
);

export const SESSION_COOKIE = "bo_session";
const MAX_AGE_S = 60 * 60 * 24 * 7; // 7 gün

export type SessionData = { sub: string; email: string; name?: string | null };

export async function signSession(data: SessionData): Promise<string> {
  return new SignJWT({ email: data.email, name: data.name ?? null })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(data.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_S}s`)
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const p = payload as JWTPayload & { email?: string; name?: string | null };
    if (!p.sub || !p.email) return null;
    return { sub: p.sub, email: p.email, name: p.name ?? null };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_S,
};
