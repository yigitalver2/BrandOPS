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
      await db.execute(`
        CREATE TABLE IF NOT EXISTS pipeline_runs (
          id              TEXT PRIMARY KEY,
          created_by      TEXT,
          status          TEXT NOT NULL,
          started_at      INTEGER NOT NULL,
          finished_at     INTEGER,
          latest_event_at INTEGER NOT NULL,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS pipeline_artifacts (
          run_id      TEXT NOT NULL,
          agent       TEXT NOT NULL,
          name        TEXT NOT NULL,
          payload     TEXT NOT NULL,
          created_at  INTEGER NOT NULL,
          updated_at  INTEGER NOT NULL,
          PRIMARY KEY (run_id, agent),
          FOREIGN KEY (run_id) REFERENCES pipeline_runs(id) ON DELETE CASCADE
        )
      `);
      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status_latest
        ON pipeline_runs(status, latest_event_at DESC)
      `);
      await db.execute({
        sql: `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          "usr_demo",
          DEMO_EMAIL,
          DEMO_HASH,
          "Demo User",
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

export type PipelineRunRow = {
  id: string;
  created_by: string | null;
  status: string;
  started_at: number;
  finished_at: number | null;
  latest_event_at: number;
};

export type PipelineArtifactRow = {
  run_id: string;
  agent: string;
  name: string;
  payload: string;
  created_at: number;
  updated_at: number;
};

export async function createPipelineRun(run: {
  id: string;
  createdBy: string;
  status?: string;
}): Promise<void> {
  const now = Date.now();
  await db.execute({
    sql: `INSERT OR REPLACE INTO pipeline_runs
          (id, created_by, status, started_at, finished_at, latest_event_at)
          VALUES (?, ?, ?, ?, NULL, ?)`,
    args: [run.id, run.createdBy, run.status ?? "running", now, now],
  });
}

export async function savePipelineArtifact(input: {
  runId: string;
  agent: string;
  name: string;
  payload: unknown;
}): Promise<void> {
  const now = Date.now();
  await db.batch([
    {
      sql: `INSERT INTO pipeline_artifacts
            (run_id, agent, name, payload, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(run_id, agent) DO UPDATE SET
              name = excluded.name,
              payload = excluded.payload,
              updated_at = excluded.updated_at`,
      args: [
        input.runId,
        input.agent,
        input.name,
        JSON.stringify(input.payload),
        now,
        now,
      ],
    },
    {
      sql: `UPDATE pipeline_runs
            SET latest_event_at = ?, status = CASE
              WHEN status = 'completed' THEN status
              ELSE 'running'
            END
            WHERE id = ?`,
      args: [now, input.runId],
    },
  ]);
}

export async function finishPipelineRun(input: {
  runId: string;
  status: "completed" | "failed" | "needs_review";
}): Promise<void> {
  const now = Date.now();
  await db.execute({
    sql: `UPDATE pipeline_runs
          SET status = ?, finished_at = ?, latest_event_at = ?
          WHERE id = ?`,
    args: [input.status, now, now, input.runId],
  });
}

export async function getLatestCompletedPipelineRun(): Promise<PipelineRunRow | null> {
  const res = await db.execute({
    sql: `SELECT * FROM pipeline_runs
          WHERE status = 'completed'
          ORDER BY latest_event_at DESC
          LIMIT 1`,
  });
  return (res.rows[0] as unknown as PipelineRunRow) ?? null;
}

export async function getPipelineArtifacts(
  runId: string
): Promise<PipelineArtifactRow[]> {
  const res = await db.execute({
    sql: `SELECT * FROM pipeline_artifacts
          WHERE run_id = ?
          ORDER BY created_at ASC`,
    args: [runId],
  });
  return res.rows as unknown as PipelineArtifactRow[];
}
