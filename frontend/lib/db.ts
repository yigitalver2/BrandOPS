import "server-only";
import { createClient, type Client } from "@libsql/client";

// Lokalde: DATABASE_URL ayarlı değilse yerel SQLite dosyası (file:local.db).
// Prod (Vercel): DATABASE_URL=libsql://... + DATABASE_AUTH_TOKEN (Turso) ayarla.
const url = process.env.DATABASE_URL || "file:local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

export const db: Client = createClient({ url, authToken });

// Demo hesabı: demo@brandops.ai / demo1234 (bcrypt, cost 10)
const DEMO_EMAIL = "demo@brandops.ai";
const DEMO_HASH = "$2b$10$yXoaMQYiU8TuW4hLb7FEv.AsYwXgZMSfmWFN5NIKkDLrp6sjPljyu";

let ready: Promise<void> | null = null;

/** Şemayı (tek seferlik) hazırlar ve demo hesabını ekler. Her route bunu await eder. */
export function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id            TEXT PRIMARY KEY,
          email         TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          name          TEXT,
          created_at    INTEGER NOT NULL
        )
      `);
      await db.execute({
        sql: `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          "usr_demo",
          DEMO_EMAIL,
          DEMO_HASH,
          "Demo Kullanıcı",
          Date.now(),
        ],
      });
    })().catch((e) => {
      ready = null; // başarısızsa tekrar denensin
      throw e;
    });
  }
  return ready;
}

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: number;
};

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const res = await db.execute({
    sql: "SELECT * FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });
  return (res.rows[0] as unknown as UserRow) ?? null;
}

export async function createUser(u: {
  id: string;
  email: string;
  passwordHash: string;
  name?: string | null;
}): Promise<void> {
  await db.execute({
    sql: `INSERT INTO users (id, email, password_hash, name, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [u.id, u.email, u.passwordHash, u.name ?? null, Date.now()],
  });
}
