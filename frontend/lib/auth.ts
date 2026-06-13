import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  signSession,
  verifySession,
  sessionCookieOptions,
  type SessionData,
} from "./session";

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Oturumu açar: imzalı JWT'yi httpOnly cookie olarak yazar. */
export async function setSession(data: SessionData): Promise<void> {
  const token = await signSession(data);
  cookies().set(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function clearSession(): Promise<void> {
  cookies().set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
}

/** Geçerli oturumu döndürür (yoksa null). Server component / route handler için. */
export async function getSession(): Promise<SessionData | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
