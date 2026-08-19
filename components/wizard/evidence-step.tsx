"use client";

import { useRef, useState } from "react";
import { Alert, Button, ConfidenceBadge, inputClass } from "@/components/ui";
import type { EvidenceDocument, EvidenceExtraction } from "@/lib/schema";

const UPLOAD_BUTTONS: { type: EvidenceDocument["documentType"]; label: string }[] = [
  { type: "marriage_certificate", label: "Upload marriage certificate" },
  { type: "death_certificate", label: "Upload death certificate" },
  { type: "birth_certificate", label: "Upload birth certificate" },
  { type: "financial_statement", label: "Upload financial statement" },
];

export function EvidenceStep({
  submissionId,
  extractions,
  onUploaded,
  onFieldEdited,
}: {
  submissionId: string | null;
  extractions: EvidenceExtraction[];
  onUploaded: (document: EvidenceDocument, extraction: EvidenceExtraction) => void;
  onFieldEdited: (extractionId: string, fieldName: string, value: string) => void;
}) {
  const [pendingType, setPendingType] = useState<EvidenceDocument["documentType"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeType, setActiveType] = useState<EvidenceDocument["documentType"] | null>(null);

  function triggerUpload(type: EvidenceDocument["documentType"]) {
    setActiveType(type);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(fileName: string) {
    if (!submissionId || !activeType) return;
    setPendingType(activeType);
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, documentType: activeType, fileName }),
      });
      if (!res.ok) throw new Error("Extraction failed");
      const data = await res.json();
      onUploaded(data.document, data.extraction);
    } catch {
      setError("We couldn't process that document. Try again.");
    } finally {
      setPendingType(null);
      setActiveType(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-3 text-sm font-semibold">Supporting evidence</p>
        <div className="flex flex-wrap gap-3">
          {UPLOAD_BUTTONS.map((btn) => (
            <Button
              key={btn.type}
              type="button"
              variant="secondary"
              disabled={!submissionId || pendingType !== null}
              onClick={() => triggerUpload(btn.type)}
            >
              {pendingType === btn.type ? "Extracting…" : btn.label}
            </Button>
          ))}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelected(file.name);
            e.target.value = "";
          }}
        />
        {error && (
          <div className="mt-2">
            <Alert type="error">{error}</Alert>
          </div>
        )}
        <p className="mt-2 text-xs text-[color:var(--color-muted)]">
          Extraction is a deterministic mock standing in for CAVE-style AI/OCR
          — pick any file, the demo returns representative confidence scores.
        </p>
      </div>

      {extractions.length === 0 && (
        <p className="text-sm text-[color:var(--color-muted)]">
          No documents processed yet.
        </p>
      )}

      {extractions.map((extraction) => {
        const needsReview = extraction.fields.some((f) => f.status === "needs_review");
        return (
          <div key={extraction.id} className="rounded border border-[color:var(--color-border)]">
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3">
              <p className="text-sm font-semibold text-[color:var(--color-navy)]">
                {extraction.documentType.replace(/_/g, " ")}
              </p>
              {needsReview ? (
                <span className="rounded-full border-2 border-amber-600 px-3 py-0.5 text-xs font-bold uppercase text-amber-700">
                  Needs review
                </span>
              ) : (
                <span className="rounded-full border-2 border-green-600 px-3 py-0.5 text-xs font-bold uppercase text-green-700">
                  Accepted
                </span>
              )}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-[color:var(--color-muted)]">
                  <th className="px-4 py-2 font-semibold">Field</th>
                  <th className="px-4 py-2 font-semibold">Extracted value</th>
                  <th className="px-4 py-2 font-semibold">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {extraction.fields.map((field) => (
                  <tr key={field.field} className="border-t border-[color:var(--color-border)]">
                    <td className="px-4 py-2 text-[color:var(--color-muted)]">{field.label}</td>
                    <td className="px-4 py-2">
                      <input
                        className={`${inputClass} w-full`}
                        value={field.value}
                        onChange={(e) => onFieldEdited(extraction.id, field.field, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <ConfidenceBadge confidence={field.confidence} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
