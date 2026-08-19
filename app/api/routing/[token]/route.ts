import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params;
  const store = getStore();
  const thirdPartyRequest = await store.getThirdPartyRequestByToken(token);
  if (!thirdPartyRequest) {
    return NextResponse.json({ error: "Link not found or expired" }, { status: 404 });
  }
  if (new Date(thirdPartyRequest.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "This secure link has expired" }, { status: 410 });
  }

  const submission = await store.getSubmission(thirdPartyRequest.submissionId);
  if (thirdPartyRequest.status === "sent") {
    await store.markThirdPartyOpened(token);
    await store.addTraceEvent(
      thirdPartyRequest.submissionId,
      "routing",
      "Physician opened the secure single-use link",
    );
  }

  return NextResponse.json({
    request: thirdPartyRequest,
    veteranName: [submission?.veteran.firstName, submission?.veteran.lastName]
      .filter(Boolean)
      .join(" "),
    claimantName: [submission?.claimant.firstName, submission?.claimant.lastName]
      .filter(Boolean)
      .join(" "),
  });
}

const CompleteRequestSchema = z.object({
  physicianName: z.string().min(1, "Physician name is required"),
  clinicalFindings: z.string().min(1, "Clinical findings are required"),
  signature: z.string().min(1, "Signature is required"),
});

export async function POST(request: Request, { params }: RouteParams) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = CompleteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const store = getStore();
  const existing = await store.getThirdPartyRequestByToken(token);
  if (!existing) {
    return NextResponse.json({ error: "Link not found or expired" }, { status: 404 });
  }
  if (existing.status === "completed") {
    return NextResponse.json({ error: "This request has already been completed" }, { status: 409 });
  }

  const updated = await store.completeThirdPartyRequest(token, parsed.data);
  if (updated) {
    await store.addTraceEvent(
      updated.submissionId,
      "routing",
      `Physician ${parsed.data.physicianName} completed and e-signed VA Form 21-2680`,
    );
    await store.addTraceEvent(
      updated.submissionId,
      "validation",
      "Third-party submission validated against the shared schema",
    );
  }

  return NextResponse.json({ request: updated });
}
