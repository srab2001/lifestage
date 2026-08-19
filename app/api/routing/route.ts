import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";

const RoutingRequestSchema = z.object({
  submissionId: z.string(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = RoutingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const store = getStore();
  const submission = await store.getSubmission(parsed.data.submissionId);
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const thirdPartyRequest = await store.createThirdPartyRequest(
    submission.id,
    "21-2680",
  );
  await store.addTraceEvent(
    submission.id,
    "routing",
    "Secure single-use link issued to physician for VA Form 21-2680",
  );

  return NextResponse.json({ request: thirdPartyRequest }, { status: 201 });
}
