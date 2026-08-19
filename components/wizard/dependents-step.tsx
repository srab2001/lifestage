"use client";

import { Button, Field, inputClass, selectClass } from "@/components/ui";
import type { Dependent } from "@/lib/schema";

const RELATIONSHIPS: { value: Dependent["relationship"]; label: string }[] = [
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "stepchild", label: "Stepchild" },
  { value: "other", label: "Other" },
];

function newDependent(): Dependent {
  return {
    id: crypto.randomUUID(),
    firstName: "",
    lastName: "",
    relationship: "child",
    dateOfBirth: "",
    hasSsn: false,
  };
}

export function DependentsStep({
  value,
  onChange,
}: {
  value: Dependent[];
  onChange: (dependents: Dependent[]) => void;
}) {
  function updateDependent(id: string, patch: Partial<Dependent>) {
    onChange(value.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function removeDependent(id: string) {
    onChange(value.filter((d) => d.id !== id));
  }

  return (
    <div className="flex flex-col gap-5">
      {value.length === 0 && (
        <p className="text-sm text-[color:var(--color-muted)]">
          No dependents added yet. Add a spouse or child if this claim
          includes dependents-management (21-686c / 21-674).
        </p>
      )}

      {value.map((dependent, i) => (
        <div key={dependent.id} className="rounded border border-[color:var(--color-border)] p-4">
          <p className="mb-3 text-sm font-semibold text-[color:var(--color-navy)]">
            Dependent {i + 1}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor={`d-first-${dependent.id}`}>
              <input
                id={`d-first-${dependent.id}`}
                className={inputClass}
                value={dependent.firstName}
                onChange={(e) => updateDependent(dependent.id, { firstName: e.target.value })}
              />
            </Field>
            <Field label="Last name" htmlFor={`d-last-${dependent.id}`}>
              <input
                id={`d-last-${dependent.id}`}
                className={inputClass}
                value={dependent.lastName}
                onChange={(e) => updateDependent(dependent.id, { lastName: e.target.value })}
              />
            </Field>
            <Field label="Relationship" htmlFor={`d-rel-${dependent.id}`}>
              <select
                id={`d-rel-${dependent.id}`}
                className={selectClass}
                value={dependent.relationship}
                onChange={(e) =>
                  updateDependent(dependent.id, {
                    relationship: e.target.value as Dependent["relationship"],
                  })
                }
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date of birth" htmlFor={`d-dob-${dependent.id}`}>
              <input
                id={`d-dob-${dependent.id}`}
                type="date"
                className={inputClass}
                value={dependent.dateOfBirth}
                onChange={(e) => updateDependent(dependent.id, { dateOfBirth: e.target.value })}
              />
            </Field>
          </div>

          <fieldset className="mt-4">
            <legend className="text-sm font-semibold">
              Does this dependent have a Social Security number?
            </legend>
            <div className="mt-2 flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`d-ssn-${dependent.id}`}
                  checked={dependent.hasSsn}
                  onChange={() => updateDependent(dependent.id, { hasSsn: true })}
                />
                Yes
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`d-ssn-${dependent.id}`}
                  checked={!dependent.hasSsn}
                  onChange={() => updateDependent(dependent.id, { hasSsn: false, ssn: undefined })}
                />
                No — explain in the interview notes
              </label>
            </div>
          </fieldset>

          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => removeDependent(dependent.id)}
          >
            Remove dependent
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        className="self-start"
        onClick={() => onChange([...value, newDependent()])}
      >
        + Add a dependent
      </Button>
    </div>
  );
}
