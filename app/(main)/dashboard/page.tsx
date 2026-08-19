import Link from "next/link";
import { auth, signOut } from "@/auth";
import { getStore } from "@/lib/store";
import { StatusBadge } from "@/components/ui";
import { TourLauncher, type TourStep } from "@/components/guided-tour";
import { ValueCallout } from "@/components/value-callout";

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="dashboard-metrics"]',
    title: "Six live metrics",
    body: "Read directly from the store on every page load — total submissions, how many are complete, how many are waiting on a physician, average extraction confidence, third-party completion rate, and total trace events recorded system-wide.",
  },
  {
    selector: '[data-tour="dashboard-claims"]',
    title: "Claims list",
    body: "Every submission created through the interview shows up here in real time. Click a row to load its detail and transaction trace on the right.",
  },
  {
    selector: '[data-tour="dashboard-trace"]',
    title: "Transaction trace",
    body: "Every meaningful step — intake, extraction, routing, validation, submission — recorded in order with a timestamp. This is what proves a submission didn't silently fail somewhere, directly answering the PWS's data governance and observability language.",
  },
];

export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[color:var(--color-border)] p-4">
      <p className="text-2xl font-bold text-[color:var(--color-navy)]">{value}</p>
      <p className="mt-1 text-xs text-[color:var(--color-muted)]">{label}</p>
    </div>
  );
}

function formatPct(n: number | null) {
  return n === null ? "—" : `${Math.round(n * 100)}%`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ claim?: string }>;
}) {
  const { claim } = await searchParams;
  const session = await auth();
  const store = getStore();
  const [submissions, metrics] = await Promise.all([
    store.listSubmissions(),
    store.getMetrics(),
  ]);
  const selectedId = claim ?? submissions[0]?.id;
  const selected = submissions.find((s) => s.id === selectedId);
  const traceEvents = selectedId ? await store.listTraceEvents(selectedId) : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--color-navy)]">
            Staff observability dashboard
          </h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Live claim status, metrics, and transaction trace — the seed of
            the recurring Delivery and Monitoring Report (PWS 5.2).
          </p>
        </div>
        <div className="flex items-start gap-4">
          <TourLauncher steps={TOUR_STEPS} />
          {session?.user && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <p className="text-xs text-[color:var(--color-muted)]">
                Signed in as {session.user.email}
              </p>
              <button type="submit" className="text-xs font-semibold text-[color:var(--color-blue)] hover:underline">
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>

      <ValueCallout
        id="value-dashboard"
        va="Claim status, extraction confidence, and a full transaction trace are visible live — the exact Delivery and Monitoring Report data PWS 5.2 calls for, without a separate reporting pipeline to build and maintain."
        veteran="The audit trail exposed here is what lets someone actually answer 'what happened to my claim,' instead of a claim's status disappearing into a black box after it's filed."
      />

      <div
        data-tour="dashboard-metrics"
        className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
      >
        <StatCard label="Total submissions" value={String(metrics.totalSubmissions)} />
        <StatCard label="Complete" value={String(metrics.completeSubmissions)} />
        <StatCard label="Pending third-party" value={String(metrics.pendingThirdParty)} />
        <StatCard label="Avg. extraction confidence" value={formatPct(metrics.avgExtractionConfidence)} />
        <StatCard label="Third-party completion" value={formatPct(metrics.thirdPartyCompletionRate)} />
        <StatCard label="Trace events" value={String(metrics.totalTraceEvents)} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div data-tour="dashboard-claims">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[color:var(--color-muted)]">
            Claims
          </h2>
          {submissions.length === 0 ? (
            <p className="text-sm text-[color:var(--color-muted)]">
              No submissions yet — start an application to populate this dashboard.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--color-border)] text-left text-xs uppercase text-[color:var(--color-muted)]">
                  <th className="py-2 font-semibold">ID</th>
                  <th className="py-2 font-semibold">Claimant</th>
                  <th className="py-2 font-semibold">Status</th>
                  <th className="py-2 font-semibold">Dep.</th>
                  <th className="py-2 font-semibold">Docs</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-b border-[color:var(--color-border)] ${
                      s.id === selectedId ? "bg-[color:var(--color-blue-light)]/30" : ""
                    }`}
                  >
                    <td className="py-2">
                      <Link
                        href={`/dashboard?claim=${s.id}`}
                        className="font-mono text-xs text-[color:var(--color-blue)] hover:underline"
                      >
                        {s.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-2">
                      {[s.claimant.firstName, s.claimant.lastName].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="py-2">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-2">{s.dependents.length}</td>
                    <td className="py-2">{s.evidence.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[color:var(--color-muted)]">
            Claim detail
          </h2>
          {selected ? (
            <div className="rounded border border-[color:var(--color-border)] p-4 text-sm">
              <p className="font-mono text-xs text-[color:var(--color-muted)]">{selected.id}</p>
              <p className="mt-1 font-semibold">
                {[selected.veteran.firstName, selected.veteran.lastName].filter(Boolean).join(" ") || "Unnamed Veteran"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                Updated {new Date(selected.updatedAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-muted)]">Select a claim.</p>
          )}

          <h2
            data-tour="dashboard-trace"
            className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-[color:var(--color-muted)]"
          >
            Transaction trace
          </h2>
          {traceEvents.length === 0 ? (
            <p className="text-sm text-[color:var(--color-muted)]">No trace events for this claim yet.</p>
          ) : (
            <ol className="relative border-l-2 border-[color:var(--color-border)] pl-4">
              {traceEvents.map((e) => (
                <li key={e.id} className="mb-4">
                  <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-[color:var(--color-navy)]" />
                  <p className="text-xs font-bold uppercase text-[color:var(--color-navy)]">{e.step}</p>
                  <p className="text-sm">{e.message}</p>
                  <p className="text-xs text-[color:var(--color-muted)]">
                    {new Date(e.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
