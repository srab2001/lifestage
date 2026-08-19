import { buildDataDictionaryJsonSchema, SCHEMA_VERSION } from "@/lib/schema";
import { TourLauncher, type TourStep } from "@/components/guided-tour";
import { ValueCallout } from "@/components/value-callout";

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="schema-hero"]',
    title: "One schema, generated from code",
    body: "This isn't a hand-maintained spec that can drift from what the app actually validates — it's generated directly from the same Zod schemas the API routes import, every time this page renders.",
  },
  {
    selector: '[data-tour="schema-dictionary"]',
    title: "The full data dictionary",
    body: "Every entity — VeteranInfo, ClaimantInfo, Dependent, EvidenceExtraction, ThirdPartyRequest, Submission, TraceEvent — with its exact required/optional fields and types. Scroll or use the keyboard (it's a focusable, keyboard-scrollable region).",
  },
];

export default function SchemaPage() {
  const dictionary = buildDataDictionaryJsonSchema();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4" data-tour="schema-hero">
        <div>
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
        </div>
        <TourLauncher steps={TOUR_STEPS} />
      </div>

      <ValueCallout
        id="value-schema"
        va="Publishes the exact validation contract every submission is checked against, generated from code so it can't drift from what's actually enforced — closing a common gap between documented and actual data requirements."
        veteran="A published, versioned contract for what a 'complete' claim looks like means requirements can't shift silently between when a Veteran files and when it's reviewed."
      />

      <pre
        data-tour="schema-dictionary"
        tabIndex={0}
        role="region"
        aria-label="Data dictionary JSON Schema"
        className="mt-6 max-h-[70vh] overflow-auto rounded border border-[color:var(--color-border)] bg-[#0b1f38] p-5 text-xs leading-relaxed text-[#d6e4ff] focus:outline-2 focus:outline-offset-2 focus:outline-[color:var(--color-blue)]"
      >
        {JSON.stringify(dictionary, null, 2)}
      </pre>
    </div>
  );
}
