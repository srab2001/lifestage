"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui";
import { TourLauncher, type TourStep } from "@/components/guided-tour";
import { WizardShell, WIZARD_STEPS } from "./wizard-shell";
import { VeteranStep } from "./veteran-step";
import { ClaimantStep } from "./claimant-step";
import { DependentsStep } from "./dependents-step";
import { AidAttendanceStep } from "./aid-attendance-step";
import { EvidenceStep } from "./evidence-step";
import { RoutingStep } from "./routing-step";
import { ReviewStep } from "./review-step";
import type {
  AidAttendance,
  ClaimantInfo,
  Dependent,
  EvidenceDocument,
  EvidenceExtraction,
  Submission,
  ThirdPartyRequest,
  VeteranInfo,
} from "@/lib/schema";

const emptySubmissionView = (): Submission => ({
  id: "",
  status: "draft",
  veteran: {},
  claimant: {},
  dependents: [],
  aidAttendance: {},
  evidence: [],
  extractions: [],
  createdAt: "",
  updatedAt: "",
});

export function ApplyWizard() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [veteran, setVeteran] = useState<Partial<VeteranInfo>>({});
  const [claimant, setClaimant] = useState<Partial<ClaimantInfo>>({});
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [aidAttendance, setAidAttendance] = useState<Partial<AidAttendance>>({});
  const [evidence, setEvidence] = useState<EvidenceDocument[]>([]);
  const [extractions, setExtractions] = useState<EvidenceExtraction[]>([]);
  const [thirdPartyRequest, setThirdPartyRequest] = useState<ThirdPartyRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback(
    async (patch: Record<string, unknown>) => {
      const url = submissionId ? `/api/submissions/${submissionId}` : "/api/submissions";
      const res = await fetch(url, {
        method: submissionId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = Array.isArray(data.issues)
          ? data.issues
              .map((issue: { path: (string | number)[]; message: string }) =>
                `${issue.path.join(".")}: ${issue.message}`,
              )
              .join("; ")
          : (data.error ?? "Could not save this step");
        throw new Error(detail);
      }
      if (!submissionId) setSubmissionId(data.submission.id);
      return data.submission as Submission;
    },
    [submissionId],
  );

  async function goNext(patch: Record<string, unknown> = {}) {
    setError(null);
    try {
      await persist(patch);
      setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving this step. Please try again.");
    }
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSubmit() {
    if (!submissionId) return;
    setSubmitting(true);
    setError(null);
    try {
      await persist({ status: "submitted" });
      router.push(`/confirmation/${submissionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't submit this claim. Please try again.");
      setSubmitting(false);
    }
  }

  function jumpToStep(index: number) {
    // Evidence and routing need a draft submission to exist — created here
    // if the tour jumps straight there without walking step 1 first. Fired
    // without awaiting (TourStep.beforeShow is synchronous): the step's
    // upload/send controls are simply disabled for the moment it takes to
    // resolve, same as they would be on a slow connection.
    if (index >= 4 && !submissionId) persist({});
    setStepIndex(index);
  }

  const TOUR_STEPS: TourStep[] = [
    {
      selector: '[data-tour="wizard-step-0"]',
      title: "The Lifestage interview",
      body: "Seven steps, saved as you go. This tour jumps between them to show what each one demonstrates — Back/Continue still work normally once you're exploring on your own.",
    },
    {
      selector: '[data-tour="wizard-step-2"]',
      title: "Dependents",
      body: "Add or remove dependents inline, right here in the interview — each one asks whether they have a Social Security number.",
      beforeShow: () => jumpToStep(2),
    },
    {
      selector: '[data-tour="evidence-upload"]',
      title: "Evidence upload & extraction",
      body: "Upload any file and watch it come back as a table of extracted fields with confidence scores — a deterministic mock standing in for real AI/OCR, but the review-and-correct interaction is real. Try uploading one after the tour.",
      beforeShow: () => jumpToStep(4),
    },
    {
      selector: '[data-tour="routing-send"]',
      title: "Secure third-party routing",
      body: "This issues a real single-use link a physician could use to complete VA Form 21-2680 with no account — try clicking it after the tour to see the physician's side.",
      beforeShow: () => jumpToStep(5),
    },
    {
      selector: '[data-tour="wizard-step-6"]',
      title: "Review & submit",
      body: "A read-only summary before the record is finalized. Submitting takes you to a confirmation page — and this claim immediately shows up on the staff dashboard's transaction trace.",
      beforeShow: () => jumpToStep(6),
    },
  ];

  const reviewSubmission: Submission = {
    ...emptySubmissionView(),
    id: submissionId ?? "",
    veteran,
    claimant,
    dependents,
    aidAttendance,
    evidence,
    extractions,
  };

  return (
    <div>
      <div className="mx-auto flex max-w-2xl justify-end px-6 pt-4">
        <TourLauncher steps={TOUR_STEPS} />
      </div>

      {error && (
        <div className="mx-auto max-w-2xl px-6 pt-2">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {stepIndex === 0 && (
        <WizardShell
          stepIndex={0}
          tourId="wizard-step-0"
          title="Veteran information"
          hint="This information supports Pension, burial, and dependents-management forms (21P-527EZ, 21P-530EZ, 21-686c)."
          showBack={false}
          onContinue={() => goNext({ veteran })}
        >
          <VeteranStep value={veteran} onChange={(patch) => setVeteran((v) => ({ ...v, ...patch }))} />
        </WizardShell>
      )}

      {stepIndex === 1 && (
        <WizardShell
          stepIndex={1}
          title="Claimant information"
          hint="The person completing this application on the Veteran's behalf, if different."
          onBack={goBack}
          onContinue={() => goNext({ claimant })}
        >
          <ClaimantStep value={claimant} onChange={(patch) => setClaimant((c) => ({ ...c, ...patch }))} />
        </WizardShell>
      )}

      {stepIndex === 2 && (
        <WizardShell
          stepIndex={2}
          tourId="wizard-step-2"
          title="Dependents"
          hint="Add any dependents whose status needs to be reported or updated."
          onBack={goBack}
          onContinue={() => goNext({ dependents })}
        >
          <DependentsStep value={dependents} onChange={setDependents} />
        </WizardShell>
      )}

      {stepIndex === 3 && (
        <WizardShell
          stepIndex={3}
          title="Aid & Attendance screening"
          onBack={goBack}
          onContinue={() => goNext({ aidAttendance })}
        >
          <AidAttendanceStep
            value={aidAttendance}
            onChange={(patch) => setAidAttendance((a) => ({ ...a, ...patch }))}
          />
        </WizardShell>
      )}

      {stepIndex === 4 && (
        <WizardShell
          stepIndex={4}
          title="Evidence & extraction"
          hint="Upload supporting documents. Extracted fields are reviewable and correctable before they're accepted."
          onBack={goBack}
          onContinue={() => goNext()}
        >
          <EvidenceStep
            submissionId={submissionId}
            extractions={extractions}
            onUploaded={(document, extraction) => {
              setEvidence((e) => [...e, document]);
              setExtractions((ex) => [...ex, extraction]);
            }}
            onFieldEdited={(extractionId, fieldName, value) =>
              setExtractions((ex) =>
                ex.map((e) =>
                  e.id === extractionId
                    ? {
                        ...e,
                        fields: e.fields.map((f) =>
                          f.field === fieldName ? { ...f, value, status: "corrected" } : f,
                        ),
                      }
                    : e,
                ),
              )
            }
          />
        </WizardShell>
      )}

      {stepIndex === 5 && (
        <WizardShell
          stepIndex={5}
          title="Physician routing (optional)"
          onBack={goBack}
          onContinue={() => goNext()}
        >
          <RoutingStep
            submissionId={submissionId}
            request={thirdPartyRequest}
            onRequestChange={setThirdPartyRequest}
          />
        </WizardShell>
      )}

      {stepIndex === 6 && (
        <WizardShell
          stepIndex={6}
          tourId="wizard-step-6"
          title="Review & submit"
          onBack={goBack}
          onContinue={handleSubmit}
          continueLabel={submitting ? "Submitting…" : "Submit application"}
          continueDisabled={submitting}
        >
          <ReviewStep submission={reviewSubmission} />
        </WizardShell>
      )}
    </div>
  );
}
