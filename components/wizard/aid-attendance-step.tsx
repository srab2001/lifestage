"use client";

import { Field } from "@/components/ui";
import type { AidAttendance } from "@/lib/schema";

export function AidAttendanceStep({
  value,
  onChange,
}: {
  value: Partial<AidAttendance>;
  onChange: (patch: Partial<AidAttendance>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend className="text-sm font-semibold">
          Does the claimant need help with daily activities such as bathing,
          dressing, or managing medication?
        </legend>
        <p className="mt-1 text-xs text-[color:var(--color-muted)]">
          This screens for Aid &amp; Attendance / Housebound benefits.
        </p>
        <div className="mt-3 flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="needs-aa"
              checked={value.needsAidAndAttendance === true}
              onChange={() => onChange({ needsAidAndAttendance: true })}
            />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="needs-aa"
              checked={value.needsAidAndAttendance === false}
              onChange={() => onChange({ needsAidAndAttendance: false, details: undefined })}
            />
            No
          </label>
        </div>
      </fieldset>

      {value.needsAidAndAttendance && (
        <Field
          label="Briefly describe the daily assistance needed"
          htmlFor="aa-details"
          hint="This detail helps route the claim to a physician exam in the next step."
        >
          <textarea
            id="aa-details"
            rows={4}
            className="rounded border border-[color:var(--color-border)] px-3 py-2 text-sm focus:border-[color:var(--color-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-blue-light)]"
            value={value.details ?? ""}
            onChange={(e) => onChange({ details: e.target.value })}
          />
        </Field>
      )}
    </div>
  );
}
