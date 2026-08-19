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
      <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--color-muted)]">
        Lifestage interview
      </p>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {WIZARD_STEPS.map((step, i) => (
          <span
            key={step}
            className={`h-1.5 flex-1 rounded-full ${
              i <= stepIndex ? "bg-[color:var(--color-navy)]" : "bg-[color:var(--color-border)]"
            }`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-[color:var(--color-muted)]">
        Step {stepIndex + 1} of {WIZARD_STEPS.length}
      </p>

      <h1 className="mt-6 text-xl font-bold text-[color:var(--color-navy)]">{title}</h1>
      {hint && <p className="mt-2 text-sm text-[color:var(--color-muted)]">{hint}</p>}

      <div className="mt-6 rounded border border-[color:var(--color-border)] p-6">
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
