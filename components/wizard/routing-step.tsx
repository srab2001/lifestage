"use client";

import { useState } from "react";
import { Button, StatusBadge } from "@/components/ui";
import type { ThirdPartyRequest } from "@/lib/schema";

export function RoutingStep({
  submissionId,
  request,
  onRequestChange,
}: {
  submissionId: string | null;
  request: ThirdPartyRequest | null;
  onRequestChange: (request: ThirdPartyRequest) => void;
}) {
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function sendLink() {
    if (!submissionId) return;
    setSending(true);
    try {
      const res = await fetch("/api/routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      if (res.ok) {
        const data = await res.json();
        onRequestChange(data.request);
      }
    } finally {
      setSending(false);
    }
  }

  const link = request ? `${typeof window !== "undefined" ? window.location.origin : ""}/third-party/${request.token}` : "";

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[color:var(--color-muted)]">
        If a physician exam (VA Form 21-2680) is needed to support this
        claim, send a secure single-use link. The physician completes and
        e-signs without a VA.gov account, and status reflects back here
        automatically.
      </p>

      <Button type="button" onClick={sendLink} disabled={sending || !submissionId || !!request}>
        {sending ? "Sending…" : request ? "Link sent" : "Send secure link to physician"}
      </Button>

      {request && (
        <div className="rounded border border-[color:var(--color-border)] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">VA Form 21-2680</p>
            <StatusBadge status={request.status} />
          </div>
          <div className="mt-3 flex gap-2">
            <input
              readOnly
              className="flex-1 rounded border border-[color:var(--color-border)] px-3 py-2 text-xs text-[color:var(--color-muted)]"
              value={link}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                navigator.clipboard?.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-[color:var(--color-muted)]">
            Expires {new Date(request.expiresAt).toLocaleDateString()}. Status
            updates live once the physician opens and signs the form.
          </p>
        </div>
      )}
    </div>
  );
}
