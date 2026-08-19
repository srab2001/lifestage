"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field, inputClass } from "@/components/ui";
import type { ThirdPartyRequest } from "@/lib/schema";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      request: ThirdPartyRequest;
      veteranName: string;
      claimantName: string;
    };

export function PhysicianPortal({ token }: { token: string }) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [physicianName, setPhysicianName] = useState("");
  const [clinicalFindings, setClinicalFindings] = useState("");
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/routing/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState({ kind: "error", message: data.error ?? "This link is invalid." });
          return;
        }
        setState({
          kind: "ready",
          request: data.request,
          veteranName: data.veteranName,
          claimantName: data.claimantName,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error", message: "This link is invalid." });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/routing/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ physicianName, clinicalFindings, signature }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setState((prev) =>
        prev.kind === "ready" ? { ...prev, request: data.request } : prev,
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (state.kind === "loading") {
    return <div className="mx-auto max-w-xl px-6 py-12 text-sm text-[color:var(--color-muted)]">Loading…</div>;
  }

  if (state.kind === "error") {
    return (
      <div className="mx-auto max-w-xl px-6 py-12">
        <Card>
          <p className="text-sm text-red-700">{state.message}</p>
        </Card>
      </div>
    );
  }

  if (state.request.status === "completed") {
    return (
      <div className="mx-auto max-w-xl px-6 py-12">
        <Card>
          <h1 className="text-lg font-bold text-[color:var(--color-navy)]">
            Thank you, this form has been submitted
          </h1>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            VA Form 21-2680 was completed and e-signed on{" "}
            {state.request.completedAt && new Date(state.request.completedAt).toLocaleString()}.
            The claimant has been notified.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-xl font-bold text-[color:var(--color-navy)]">
        Examination for VA Form 21-2680
      </h1>
      <p className="mt-2 text-sm text-[color:var(--color-muted)]">
        You&apos;ve received a secure, single-use request to complete this
        exam for {state.claimantName || "the claimant"}
        {state.veteranName ? ` (Veteran: ${state.veteranName})` : ""}. No
        VA.gov account is required.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5 rounded border border-[color:var(--color-border)] p-6">
        <Field label="Examining physician name" htmlFor="physician-name">
          <input
            id="physician-name"
            required
            className={inputClass}
            value={physicianName}
            onChange={(e) => setPhysicianName(e.target.value)}
          />
        </Field>
        <Field label="Clinical findings" htmlFor="clinical-findings">
          <textarea
            id="clinical-findings"
            required
            rows={6}
            className="rounded border border-[color:var(--color-border)] px-3 py-2 text-sm focus:border-[color:var(--color-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-blue-light)]"
            value={clinicalFindings}
            onChange={(e) => setClinicalFindings(e.target.value)}
          />
        </Field>
        <Field label="Signature" htmlFor="signature" hint="Type your full legal name to e-sign">
          <input
            id="signature"
            required
            className={inputClass}
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
          />
        </Field>

        {submitError && <p className="text-sm text-red-700">{submitError}</p>}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit & e-sign"}
        </Button>
      </form>
    </div>
  );
}
