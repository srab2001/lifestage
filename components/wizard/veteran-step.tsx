"use client";

import { Field, inputClass } from "@/components/ui";
import type { VeteranInfo } from "@/lib/schema";

export function VeteranStep({
  value,
  onChange,
}: {
  value: Partial<VeteranInfo>;
  onChange: (patch: Partial<VeteranInfo>) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field label="Veteran's first name" htmlFor="v-first">
        <input
          id="v-first"
          className={inputClass}
          value={value.firstName ?? ""}
          onChange={(e) => onChange({ firstName: e.target.value })}
        />
      </Field>
      <Field label="Veteran's last name" htmlFor="v-last">
        <input
          id="v-last"
          className={inputClass}
          value={value.lastName ?? ""}
          onChange={(e) => onChange({ lastName: e.target.value })}
        />
      </Field>
      <Field label="Date of birth" htmlFor="v-dob">
        <input
          id="v-dob"
          type="date"
          className={inputClass}
          value={value.dateOfBirth ?? ""}
          onChange={(e) => onChange({ dateOfBirth: e.target.value })}
        />
      </Field>
      <Field label="Date of death" htmlFor="v-dod" hint="Leave blank if not applicable">
        <input
          id="v-dod"
          type="date"
          className={inputClass}
          value={value.dateOfDeath ?? ""}
          onChange={(e) => onChange({ dateOfDeath: e.target.value })}
        />
      </Field>
      <Field label="Branch of service" htmlFor="v-branch">
        <input
          id="v-branch"
          className={inputClass}
          value={value.branchOfService ?? ""}
          onChange={(e) => onChange({ branchOfService: e.target.value })}
        />
      </Field>
    </div>
  );
}
