"use client";

import { Field, inputClass, selectClass } from "@/components/ui";
import type { ClaimantInfo } from "@/lib/schema";

const RELATIONSHIPS: { value: ClaimantInfo["relationshipToVeteran"]; label: string }[] = [
  { value: "spouse", label: "Spouse" },
  { value: "surviving_spouse", label: "Surviving spouse" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "other", label: "Other" },
];

export function ClaimantStep({
  value,
  onChange,
}: {
  value: Partial<ClaimantInfo>;
  onChange: (patch: Partial<ClaimantInfo>) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field label="Claimant's first name" htmlFor="c-first">
        <input
          id="c-first"
          className={inputClass}
          value={value.firstName ?? ""}
          onChange={(e) => onChange({ firstName: e.target.value })}
        />
      </Field>
      <Field label="Claimant's last name" htmlFor="c-last">
        <input
          id="c-last"
          className={inputClass}
          value={value.lastName ?? ""}
          onChange={(e) => onChange({ lastName: e.target.value })}
        />
      </Field>
      <Field label="Relationship to Veteran" htmlFor="c-relationship">
        <select
          id="c-relationship"
          className={selectClass}
          value={value.relationshipToVeteran ?? ""}
          onChange={(e) =>
            onChange({
              relationshipToVeteran: e.target.value as ClaimantInfo["relationshipToVeteran"],
            })
          }
        >
          <option value="" disabled>
            Select one
          </option>
          {RELATIONSHIPS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Date of birth" htmlFor="c-dob">
        <input
          id="c-dob"
          type="date"
          className={inputClass}
          value={value.dateOfBirth ?? ""}
          onChange={(e) => onChange({ dateOfBirth: e.target.value })}
        />
      </Field>
      <Field
        label="Last 4 of Social Security number"
        htmlFor="c-ssn"
        hint="Optional — used only to demonstrate structured data capture"
      >
        <input
          id="c-ssn"
          className={inputClass}
          maxLength={4}
          value={value.ssnLast4 ?? ""}
          onChange={(e) => onChange({ ssnLast4: e.target.value.replace(/\D/g, "") })}
        />
      </Field>
    </div>
  );
}
