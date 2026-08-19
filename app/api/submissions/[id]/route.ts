import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { SubmissionInputSchema } from "@/lib/schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const store = getStore();
  const submission = await store.getSubmission(id);
  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ submission });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = SubmissionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const store = getStore();
  const submission = await store.updateSubmission(id, parsed.data);
  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sections = Object.keys(parsed.data).filter((k) => k !== "status");
  if (sections.length) {
    await store.addTraceEvent(
      id,
      "validation",
      `Validated and saved ${sections.join(", ")} against the shared schema`,
    );
  }
  if (parsed.data.status === "submitted") {
    await store.addTraceEvent(
      id,
      "submission",
      "Submission finalized — structured record persisted",
    );
  }

  return NextResponse.json({ submission });
}
