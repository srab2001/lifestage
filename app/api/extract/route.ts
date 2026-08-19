import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { EvidenceDocumentSchema } from "@/lib/schema";
import { mockExtractFields } from "@/lib/extract";
import { z } from "zod";

const ExtractRequestSchema = z.object({
  submissionId: z.string(),
  documentType: EvidenceDocumentSchema.shape.documentType,
  fileName: z.string(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = ExtractRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { submissionId, documentType, fileName } = parsed.data;
  const store = getStore();
  const submission = await store.getSubmission(submissionId);
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const document = {
    id: randomUUID(),
    documentType,
    fileName,
    uploadedAt: new Date().toISOString(),
  };
  const fields = mockExtractFields(documentType);
  const extraction = {
    id: randomUUID(),
    documentId: document.id,
    documentType,
    fields,
    createdAt: new Date().toISOString(),
  };

  const updated = await store.updateSubmission(submissionId, {
    evidence: [...submission.evidence, document],
    extractions: [...submission.extractions, extraction],
  });

  const avgConfidence =
    fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length;
  await store.addTraceEvent(
    submissionId,
    "extraction",
    `Extracted ${fields.length} field(s) from ${fileName} (${documentType}) — avg confidence ${Math.round(avgConfidence * 100)}%`,
  );

  return NextResponse.json({ document, extraction, submission: updated });
}
