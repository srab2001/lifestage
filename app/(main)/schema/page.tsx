import { buildDataDictionaryJsonSchema, SCHEMA_VERSION } from "@/lib/schema";

export default function SchemaPage() {
  const dictionary = buildDataDictionaryJsonSchema();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-bold text-[color:var(--color-navy)]">
        Published data dictionary
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--color-muted)]">
        The single, versioned schema (PWS 2.3.2 Data Governance) that
        validates every submission at intake, after extraction, and after
        third-party completion — generated directly from the Zod schemas in{" "}
        <code className="rounded bg-[color:var(--color-bg)] px-1 py-0.5">lib/schema.ts</code>{" "}
        so the published contract can never drift from the code that
        enforces it.
      </p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
        Version {SCHEMA_VERSION}
      </p>

      <pre className="mt-6 max-h-[70vh] overflow-auto rounded border border-[color:var(--color-border)] bg-[#0b1f38] p-5 text-xs leading-relaxed text-[#d6e4ff]">
        {JSON.stringify(dictionary, null, 2)}
      </pre>
    </div>
  );
}
