import { Button } from "@/components/ui";

export const WIZARD_STEPS = [
  "Veteran information",
  "Claimant information",
  "Dependents",
  "Aid & Attendance",
  "Evidence & extraction",
  "Physician routing",
  "Review & submit",
] as const;

export function WizardShell({
  stepIndex,
  title,
  hint,
  children,
  onBack,
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
  showBack = true,
}: {
  stepIndex: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  showBack?: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div
        className="usa-step-indicator usa-step-indicator--no-labels usa-step-indicator--counters-sm"
        aria-label="Lifestage interview progress"
      >
        <ol className="usa-step-indicator__segments">
          {WIZARD_STEPS.map((step, i) => (
            <li
              key={step}
              className={`usa-step-indicator__segment ${
                i < stepIndex
                  ? "usa-step-indicator__segment--complete"
                  : i === stepIndex
                    ? "usa-step-indicator__segment--current"
                    : ""
              }`}
            >
              <span className="usa-step-indicator__segment-label">
                {step}
                <span className="usa-sr-only">
                  {i < stepIndex ? "completed" : i === stepIndex ? "current" : ""}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <div className="usa-step-indicator__header">
          {/* h1, not USWDS's usual h2/h3 — each step has no other page
              heading, so this is the page's one-and-only h1. */}
          <h1 className="usa-step-indicator__heading">
            <span className="usa-step-indicator__heading-counter">
              <span className="usa-sr-only">Step</span>
              <span className="usa-step-indicator__current-step">{stepIndex + 1}</span>
              <span className="usa-step-indicator__total-steps">
                of {WIZARD_STEPS.length}
              </span>
            </span>
            <span className="usa-step-indicator__heading-text">{title}</span>
          </h1>
        </div>
      </div>

      {hint && <p className="mt-2 text-sm text-[color:var(--color-muted)]">{hint}</p>}

      <div className="mt-6 border border-[color:var(--color-border)] p-6">
        {children}
      </div>

      <div className="mt-6 flex gap-3">
        {showBack && (
          <Button type="button" variant="secondary" onClick={onBack}>
            Back
          </Button>
        )}
        {onContinue && (
          <Button type="button" onClick={onContinue} disabled={continueDisabled}>
            {continueLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
