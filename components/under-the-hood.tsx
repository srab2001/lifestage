"use client";

import { useEffect, useState } from "react";
import { Alert, Button } from "@/components/ui";
import type { EvidenceDocument } from "@/lib/schema";

type StatusResponse = {
  env: Record<string, boolean>;
  db: { ok: boolean; kind: "postgres" | "in-memory"; error?: string };
  metrics: {
    totalSubmissions: number;
    completeSubmissions: number;
    pendingThirdParty: number;
    avgExtractionConfidence: number | null;
    thirdPartyCompletionRate: number | null;
    totalTraceEvents: number;
  } | null;
  deployment: { env: string; branch: string | null; commit: string | null };
};

function Tile({
  tone,
  title,
  detail,
}: {
  tone: "ok" | "bad" | "neutral";
  title: string;
  detail: string;
}) {
  const toneClass =
    tone === "ok"
      ? "border-green-300 bg-green-50 text-green-800"
      : tone === "bad"
        ? "border-red-300 bg-red-50 text-red-800"
        : "border-[color:var(--color-border)] bg-[color:var(--color-bg)] text-[color:var(--color-ink)]";
  return (
    <div className={`rounded border p-3 text-sm ${toneClass}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-xs opacity-90">{detail}</p>
    </div>
  );
}

function ArchBox({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="min-w-[140px] flex-1 rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3 text-center text-sm">
      <strong className="block">{title}</strong>
      <span className="text-xs text-[color:var(--color-muted)]">{detail}</span>
    </div>
  );
}

const DOCUMENT_TYPES: { value: EvidenceDocument["documentType"]; label: string }[] = [
  { value: "marriage_certificate", label: "Marriage certificate" },
  { value: "death_certificate", label: "Death certificate" },
  { value: "birth_certificate", label: "Birth certificate" },
  { value: "financial_statement", label: "Financial statement" },
];

export function UnderTheHood() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [docType, setDocType] = useState<EvidenceDocument["documentType"]>(
    "marriage_certificate",
  );
  const [preview, setPreview] = useState<unknown>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [errResponse, setErrResponse] = useState<string | null>(null);
  const [errExplain, setErrExplain] = useState<string | null>(null);

  async function loadStatus() {
    setStatusError(null);
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error(`GET /api/status returned ${res.status}`);
      setStatus(await res.json());
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Status check failed");
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status")
      .then(async (res) => {
        if (!res.ok) throw new Error(`GET /api/status returned ${res.status}`);
        const data = await res.json();
        if (!cancelled) setStatus(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setStatusError(err instanceof Error ? err.message : "Status check failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function runPreview() {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/demo/extract-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: docType }),
      });
      setPreview(await res.json());
    } finally {
      setPreviewLoading(false);
    }
  }

  async function callUnauthenticated() {
    const res = await fetch("/api/submissions", { credentials: "omit" });
    const data = await res.json().catch(() => ({}));
    setErrResponse(`HTTP ${res.status}\n${JSON.stringify(data, null, 2)}`);
    setErrExplain(
      "What happened: this request carried no session cookie on purpose. The route checks auth() before touching the store — the same route that leaked every claimant's SSN unauthenticated until it was found and fixed (see the incident below, and LESSONS_LEARNED.md).",
    );
  }

  async function callInvalidToken() {
    const res = await fetch("/api/routing/demo-invalid-token-does-not-exist");
    const data = await res.json().catch(() => ({}));
    setErrResponse(`HTTP ${res.status}\n${JSON.stringify(data, null, 2)}`);
    setErrExplain(
      "What happened: this token was never issued (or already used, or past its 7-day expiry) — /api/routing/[token] looks it up and returns a clean 404 rather than a database error or a 500.",
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-bold text-[color:var(--color-navy)]">
        Under the hood
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--color-muted)]">
        This page walks through how the Lifestage demo platform itself is
        built and operated — the same &quot;show it live, don&apos;t just
        claim it&quot; approach the interview, physician portal, and
        dashboard use, pointed at the platform instead. Every check below is
        a real fetch to this running deployment, not a screenshot.
      </p>

      {/* 1. Setting up the instance */}
      <section className="mt-8 rounded border border-[color:var(--color-border)] p-6">
        <h2 className="text-lg font-bold text-[color:var(--color-navy)]">
          1. Setting up the instance
        </h2>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Four pieces have to be wired together before anything works. This
          diagram is static, but the tiles below it call{" "}
          <code className="rounded bg-[color:var(--color-bg)] px-1">
            /api/status
          </code>{" "}
          right now.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ArchBox title="Browser" detail="claimant, physician, or staff" />
          <span aria-hidden className="text-[color:var(--color-muted)]">→</span>
          <ArchBox title="proxy.ts" detail="session check on /dashboard" />
          <span aria-hidden className="text-[color:var(--color-muted)]">→</span>
          <ArchBox title="API routes" detail="Vercel Node functions" />
          <span aria-hidden className="text-[color:var(--color-muted)]">→</span>
          <ArchBox title="Neon Postgres" detail="submissions + trace events" />
        </div>
        <div className="mt-2 flex">
          <ArchBox title="Google OAuth" detail="identity provider, called from Auth.js in the API routes above" />
        </div>

        <h3 className="mt-4 text-sm font-semibold">Live check</h3>
        {statusError && (
          <div className="mt-2">
            <Alert type="error">{statusError}</Alert>
          </div>
        )}
        {status && (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(status.env).map(([name, isSet]) => (
              <Tile
                key={name}
                tone={isSet ? "ok" : "bad"}
                title={name}
                detail={isSet ? "set" : "not set"}
              />
            ))}
          </div>
        )}
      </section>

      {/* 2. How the elements connect */}
      <section className="mt-8 rounded border border-[color:var(--color-border)] p-6">
        <h2 className="text-lg font-bold text-[color:var(--color-navy)]">
          2. How the elements connect
        </h2>

        <h3 className="mt-3 text-sm font-semibold">Signing in with Google</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          <li>
            <code className="rounded bg-[color:var(--color-bg)] px-1">proxy.ts</code>{" "}
            checks a session on every request to <code className="rounded bg-[color:var(--color-bg)] px-1">/dashboard</code>. No session → redirect to Google sign-in.
          </li>
          <li>Auth.js redirects to Google&apos;s consent screen using the app&apos;s registered OAuth client.</li>
          <li>Google redirects back with a code; Auth.js exchanges it and calls the <code className="rounded bg-[color:var(--color-bg)] px-1">signIn</code> callback in <code className="rounded bg-[color:var(--color-bg)] px-1">auth.ts</code>.</li>
          <li>
            That callback checks the email against <code className="rounded bg-[color:var(--color-bg)] px-1">ADMIN_EMAILS</code> (if set) or the{" "}
            <code className="rounded bg-[color:var(--color-bg)] px-1">@adhocteam.us</code> domain — reject, or issue a session cookie.
          </li>
          <li>The browser is redirected back to <code className="rounded bg-[color:var(--color-bg)] px-1">/dashboard</code>.</li>
        </ol>
        <p className="mt-2 rounded border-l-4 border-[color:var(--color-blue)] bg-[color:var(--color-blue-light)]/40 p-3 text-sm">
          <strong>Why it&apos;s built this way:</strong> this gates the shared
          staff dashboard to a small, known reviewer set during capture and
          review — it is explicitly not the Veteran-facing identity system.
          Production VA.gov authentication runs through Login.gov/ID.me and
          VA&apos;s ICN-based identity model (PWS 8.1.9).
        </p>

        <h3 className="mt-4 text-sm font-semibold">
          Submitting the interview
        </h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          <li>The claimant completes a step; the browser sends <code className="rounded bg-[color:var(--color-bg)] px-1">POST /api/submissions</code> (or <code className="rounded bg-[color:var(--color-bg)] px-1">PATCH .../[id]</code>).</li>
          <li>The route parses the body against the Zod schemas in <code className="rounded bg-[color:var(--color-bg)] px-1">lib/schema.ts</code> — the exact same schemas published at <code className="rounded bg-[color:var(--color-bg)] px-1">/schema</code>.</li>
          <li>A validation failure returns a 400 with the specific field and message, not a generic error.</li>
          <li>On success, the store persists the record and records a trace event, visible immediately on <code className="rounded bg-[color:var(--color-bg)] px-1">/dashboard</code>.</li>
        </ol>
        <p className="mt-2 rounded border-l-4 border-[color:var(--color-blue)] bg-[color:var(--color-blue-light)]/40 p-3 text-sm">
          <strong>Why it&apos;s built this way:</strong> one schema validates
          every entry point — direct claimant input, extracted-then-corrected
          fields, and third-party submissions — so there&apos;s no chance of
          three validation code paths quietly drifting apart. This directly
          answers PWS 2.3.2&apos;s Data Governance language.
        </p>
      </section>

      {/* 3. Live extraction preview */}
      <section className="mt-8 rounded border border-[color:var(--color-border)] p-6">
        <h2 className="text-lg font-bold text-[color:var(--color-navy)]">
          3. Try the extraction code path live
        </h2>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          This calls the exact same mock-extraction function the real
          interview&apos;s evidence-upload step uses — nothing here is a
          separate fixture baked into this page.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Document type
            <select
              className="usa-select"
              value={docType}
              onChange={(e) =>
                setDocType(e.target.value as EvidenceDocument["documentType"])
              }
            >
              {DOCUMENT_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" onClick={runPreview} disabled={previewLoading}>
            {previewLoading ? "Running…" : "Run extraction"}
          </Button>
        </div>
        {preview !== null && (
          <pre className="mt-3 max-h-64 overflow-auto rounded border border-[color:var(--color-border)] bg-[#0b1f38] p-4 text-xs text-[#d6e4ff]">
            {JSON.stringify(preview, null, 2)}
          </pre>
        )}
      </section>

      {/* 4. Errors, live */}
      <section className="mt-8 rounded border border-[color:var(--color-border)] p-6">
        <h2 className="text-lg font-bold text-[color:var(--color-navy)]">
          4. Errors, live — and how they got fixed
        </h2>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          These call the real API right now.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={callUnauthenticated}>
            Call the submissions API with no session
          </Button>
          <Button type="button" variant="secondary" onClick={callInvalidToken}>
            Fetch an invalid third-party token
          </Button>
        </div>
        {errResponse && (
          <pre className="mt-3 overflow-auto rounded border border-[color:var(--color-border)] bg-[#0b1f38] p-4 text-xs text-[#d6e4ff]">
            {errResponse}
          </pre>
        )}
        {errExplain && (
          <p className="mt-2 rounded border-l-4 border-[color:var(--color-blue)] bg-[color:var(--color-blue-light)]/40 p-3 text-sm">
            {errExplain}
          </p>
        )}

        <h3 className="mt-6 text-sm font-semibold">
          The bigger one: a real production incident
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Shortly after the Neon database was wired up, a real user hit{" "}
          <code className="rounded bg-[color:var(--color-bg)] px-1">
            error: relation &quot;trace_events&quot; does not exist
          </code>{" "}
          submitting the interview — even though the same fix that was
          supposed to prevent exactly that class of error had just shipped.
          Full write-up:{" "}
          <a
            href="https://github.com/srab2001/lifestage/blob/main/LESSONS_LEARNED.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[color:var(--color-blue)] hover:underline"
          >
            LESSONS_LEARNED.md
          </a>
          . Short version:
        </p>
        <pre className="mt-2 overflow-auto rounded border border-[color:var(--color-border)] bg-[#0b1f38] p-4 text-xs text-[#d6e4ff]">
          <span className="text-red-300">
            {"- this.schemaReady = Promise.all(\n"}
            {"-   INIT_STATEMENTS.map((statement) => this.pool.query(statement)),\n"}
            {"- );"}
          </span>
          {"\n"}
          <span className="text-green-300">
            {"+ this.schemaReady = INIT_STATEMENTS.reduce(\n"}
            {"+   (prev, statement) => prev.then(() => this.pool.query(statement)),\n"}
            {"+   Promise.resolve(undefined),\n"}
            {"+ );"}
          </span>
        </pre>
        <p className="mt-2 rounded border-l-4 border-[color:var(--color-blue)] bg-[color:var(--color-blue-light)]/40 p-3 text-sm">
          <strong>Why this was the actual fix:</strong>{" "}
          <code className="rounded bg-[color:var(--color-bg)] px-1">Promise.all</code>{" "}
          runs its statements concurrently, and the <code className="rounded bg-[color:var(--color-bg)] px-1">pg</code> connection
          pool checks out a separate connection per query — so two DDL
          statements with a real dependency (an index on a table that
          hadn&apos;t committed yet on another connection) had no
          happens-before guarantee. Running them as a sequential promise
          chain instead of a workaround like retry-on-error fixes the actual
          race rather than papering over its symptom.
        </p>
      </section>

      {/* 5. Live status */}
      <section className="mt-8 rounded border border-[color:var(--color-border)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[color:var(--color-navy)]">
            5. Live status — real signals, not decoration
          </h2>
          <Button type="button" variant="secondary" onClick={loadStatus}>
            Re-check now
          </Button>
        </div>
        {status && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Tile
              tone={status.db.ok ? "ok" : "bad"}
              title="Database"
              detail={
                status.db.ok
                  ? `Reachable (${status.db.kind === "postgres" ? "Neon Postgres" : "in-memory fallback — no DATABASE_URL"})`
                  : status.db.error ?? "Unreachable"
              }
            />
            <Tile
              tone="neutral"
              title="Deployment"
              detail={`${status.deployment.env} • ${status.deployment.branch ?? "unknown branch"}${status.deployment.commit ? ` • ${status.deployment.commit.slice(0, 7)}` : ""}`}
            />
            {status.metrics && (
              <Tile
                tone="neutral"
                title="Live metrics"
                detail={`${status.metrics.totalSubmissions} submission(s), ${status.metrics.totalTraceEvents} trace event(s)`}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
