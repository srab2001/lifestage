import { LinkButton } from "@/components/ui";
import { TourLauncher, type TourStep } from "@/components/guided-tour";
import { ValueCallout } from "@/components/value-callout";

const CAPABILITIES = [
  {
    title: "Lifestage forms experience",
    body: "One guided interview for Pension, burial, and dependents-management forms — Veteran info, claimant info, dependents, and Aid & Attendance screening.",
    href: "/apply",
    cta: "Start the interview",
  },
  {
    title: "Real-time extraction & validation",
    body: "Upload supporting evidence and review AI-assisted, confidence-scored field extraction before it's accepted into the record.",
    href: "/apply",
    cta: "See it in the interview",
  },
  {
    title: "Secure third-party routing",
    body: "Send a physician a single-use secure link to complete and e-sign VA Form 21-2680 without a VA.gov account.",
    href: "/apply",
    cta: "See it in the interview",
  },
  {
    title: "Data governance & observability",
    body: "Every submission validates against one published schema and emits a traced event, visible on a live staff dashboard.",
    href: "/dashboard",
    cta: "Open the dashboard",
  },
];

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="hero"]',
    title: "Welcome to Lifestage Benefits Optimization",
    body: "This is a working proof-of-concept for VA-26-00077490, not a slide deck — every screen this tour visits is a real, running feature. Skip ahead or go back any time.",
  },
  {
    selector: '[data-tour="disclaimer"]',
    title: "Scope, up front",
    body: "This demo shows the interaction design and data flow working end to end. It intentionally doesn't attempt real OCR/ML, Login.gov/ID.me, or integration with BGS/MMS/MAS/BPDS — see the design doc for the full list.",
  },
  {
    selector: '[data-tour="capabilities"]',
    title: "Four capability areas",
    body: "Each card maps directly to a PWS capability: the Lifestage forms experience, extraction & validation, third-party routing, and data governance & observability. Click through any of them, or continue with Start application below.",
  },
  {
    selector: '[data-tour="cta"]',
    title: "Start the interview",
    body: "This is the same interview a claimant would use — it has its own \"Take the tour\" once you're in it, walking through evidence upload, physician routing, and review & submit.",
  },
  {
    selector: '[data-tour="nav-under-the-hood"]',
    title: "Under the hood",
    body: "Curious how the platform itself is built and operated — not the claimant-facing demo, but the actual auth flow, data validation, live error handling, and a real production incident? That's a separate self-serve page, linked in the nav above.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div
        data-tour="hero"
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-[color:var(--color-navy)]">
            Lifestage Benefits Optimization
          </h1>
          <p className="mt-4 max-w-2xl text-[color:var(--color-muted)]">
            A working proof-of-concept for VA-26-00077490 spanning the Lifestage
            forms experience, document services extraction and validation, and
            secure third-party routing — one claimant journey, one underlying
            record.
          </p>
        </div>
        <TourLauncher steps={TOUR_STEPS} />
      </div>

      <div
        data-tour="disclaimer"
        className="mt-6 rounded border border-dashed border-[color:var(--color-blue)] bg-[color:var(--color-blue-light)]/40 p-4 text-sm text-[color:var(--color-navy)]"
      >
        This demo is a design and delivery-capability proof-of-concept built
        by Ad Hoc, not a VA.gov production system. See{" "}
        <span className="font-semibold">Data governance &amp; observability</span>{" "}
        below for the schema and live trace log this design is built around.
      </div>

      <ValueCallout
        id="value-landing"
        heading="Why this demo matters"
        va="Shows PWS 2.3.2 Data Governance, secure third-party routing, and observability working end-to-end in one running system — not a slide deck — ahead of any award decision."
        veteran="One guided intake replaces separate paper forms for Pension, burial, and dependents changes, with a status trail so a claim's progress is never a mystery."
      />

      <h2 className="mt-10 mb-4 text-sm font-bold uppercase tracking-wide text-[color:var(--color-muted)]">
        Capability areas demonstrated
      </h2>
      <div data-tour="capabilities" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CAPABILITIES.map((c) => (
          <div
            key={c.title}
            className="flex flex-col justify-between rounded border border-[color:var(--color-border)] p-5"
          >
            <div>
              <h3 className="font-semibold text-[color:var(--color-navy)]">{c.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--color-muted)]">{c.body}</p>
            </div>
            <a
              href={c.href}
              className="mt-4 text-sm font-semibold text-[color:var(--color-blue)] hover:underline"
            >
              {c.cta} →
            </a>
          </div>
        ))}
      </div>

      <div data-tour="cta" className="mt-10">
        <LinkButton href="/apply">Start application</LinkButton>
      </div>
    </div>
  );
}
