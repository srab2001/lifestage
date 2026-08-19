import { NextResponse } from "next/server";
import { z } from "zod";
import { EvidenceDocumentSchema } from "@/lib/schema";
import { mockExtractFields } from "@/lib/extract";

/**
 * A side-effect-free preview of the same extraction code path
 * /api/extract uses (see /under-the-hood), without needing an existing
 * submission — nothing is written anywhere. Public and safe: this
 * returns the same deterministic mock data regardless of caller.
 */
const RequestSchema = z.object({
  documentType: EvidenceDocumentSchema.shape.documentType,
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const fields = mockExtractFields(parsed.data.documentType);
  return NextResponse.json({ documentType: parsed.data.documentType, fields });
}
