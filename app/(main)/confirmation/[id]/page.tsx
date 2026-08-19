import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { LinkButton } from "@/components/ui";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = getStore();
  const submission = await store.getSubmission(id);
  if (!submission) notFound();

  const claimantName =
    [submission.claimant.firstName, submission.claimant.lastName].filter(Boolean).join(" ") ||
    "your claim";

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[color:var(--color-success)] text-2xl text-[color:var(--color-success)]">
        ✓
      </div>
      <h1 className="mt-4 text-2xl font-bold text-[color:var(--color-navy)]">
        Application submitted
      </h1>
      <p className="mt-2 text-sm text-[color:var(--color-muted)]">
        We received {claimantName}&apos;s application. Confirmation number{" "}
        <span className="font-mono font-semibold">{submission.id.slice(0, 8)}</span>.
      </p>

      <div className="mt-6 rounded border border-[color:var(--color-border)] p-6">
        <p className="text-sm font-semibold text-[color:var(--color-navy)]">What happens next</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[color:var(--color-muted)]">
          <li>Your submitted evidence has been validated against VA&apos;s shared data dictionary.</li>
          {submission.thirdPartyRequestId && (
            <li>
              A secure link was sent for the required physician exam. You&apos;ll be notified once
              it&apos;s complete.
            </li>
          )}
          <li>VA staff can now see this claim, its evidence, and its status on the observability dashboard.</li>
        </ul>
      </div>

      <div className="mt-6 flex gap-3">
        <LinkButton href="/" variant="secondary">
          Return home
        </LinkButton>
        <LinkButton href="/dashboard">View claim status (staff)</LinkButton>
      </div>
    </div>
  );
}
