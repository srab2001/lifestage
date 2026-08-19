import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

/**
 * Public, read-only signal for the /under-the-hood page — booleans and
 * counts only, never secret values. Every tile that page renders from
 * this comes from a real check made right now, not a static claim.
 */
export async function GET() {
  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
    GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    ADMIN_EMAILS: Boolean(process.env.ADMIN_EMAILS),
  };

  const store = getStore();
  let db: { ok: boolean; kind: "postgres" | "in-memory"; error?: string };
  if (!env.DATABASE_URL) {
    db = { ok: true, kind: "in-memory" };
  } else {
    try {
      await store.getMetrics();
      db = { ok: true, kind: "postgres" };
    } catch (err) {
      db = {
        ok: false,
        kind: "postgres",
        error: err instanceof Error ? err.message : "Unknown database error",
      };
    }
  }

  const metrics = await store.getMetrics().catch(() => null);

  const deployment = {
    env: process.env.VERCEL_ENV ?? "local",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  };

  return NextResponse.json({ env, db, metrics, deployment });
}
