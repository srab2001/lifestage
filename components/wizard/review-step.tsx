"use client";

import type { Submission } from "@/lib/schema";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[color:var(--color-border)] py-2 text-sm">
      <span className="text-[color:var(--color-muted)]">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

export function ReviewStep({ submission }: { submission: Submission }) {
  return (
    <div className="flex flex-col gap-6 text-sm">
      <section>
        <h3 className="mb-2 font-semibold text-[color:var(--color-navy)]">Veteran</h3>
        <Row
          label="Name"
          value={[submission.veteran.firstName, submission.veteran.lastName].filter(Boolean).join(" ")}
        />
        <Row label="Date of birth" value={submission.veteran.dateOfBirth ?? ""} />
        <Row label="Branch of service" value={submission.veteran.branchOfService ?? ""} />
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-[color:var(--color-navy)]">Claimant</h3>
        <Row
          label="Name"
          value={[submission.claimant.firstName, submission.claimant.lastName].filter(Boolean).join(" ")}
        />
        <Row label="Relationship" value={submission.claimant.relationshipToVeteran ?? ""} />
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-[color:var(--color-navy)]">
          Dependents ({submission.dependents.length})
        </h3>
        {submission.dependents.map((d) => (
          <Row key={d.id} label={d.relationship} value={`${d.firstName} ${d.lastName}`} />
        ))}
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-[color:var(--color-navy)]">Aid &amp; Attendance</h3>
        <Row
          label="Needs assistance"
          value={submission.aidAttendance.needsAidAndAttendance ? "Yes" : "No"}
        />
      </section>

      <section>
        <h3 className="mb-2 font-semibold text-[color:var(--color-navy)]">
          Evidence ({submission.evidence.length} document{submission.evidence.length === 1 ? "" : "s"})
        </h3>
        {submission.evidence.map((doc) => (
          <Row key={doc.id} label={doc.documentType.replace(/_/g, " ")} value={doc.fileName} />
        ))}
      </section>
    </div>
  );
}
