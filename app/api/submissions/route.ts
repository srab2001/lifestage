import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStore } from "@/lib/store";
import { SubmissionInputSchema } from "@/lib/schema";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = SubmissionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const store = getStore();
  const submission = await store.createSubmission(parsed.data);
  await store.addTraceEvent(
    submission.id,
    "intake",
    "Draft submission created from the Lifestage interview",
  );

  return NextResponse.json({ submission }, { status: 201 });
}

// Internal-only: full submissions include claimant PII (SSNs, DOBs). The
// dashboard UI reads the store directly server-side and doesn't call this;
// it exists for staff/API tooling, so it's gated the same as /dashboard.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const store = getStore();
  const submissions = await store.listSubmissions();
  return NextResponse.json({ submissions });
}
