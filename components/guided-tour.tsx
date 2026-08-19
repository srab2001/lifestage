"use client";

import { useEffect, useState } from "react";

export interface TourStep {
  /** CSS selector matching a data-tour attribute already present on the page. */
  selector: string;
  title: string;
  body: string;
  /** Runs before this step's target is queried — e.g. jump the wizard to a
   * different step, or switch a tab, so the target actually exists in the
   * DOM by the time the highlight looks for it. */
  beforeShow?: () => void;
}

/**
 * A deliberately simple tour: no full-page dimming overlay or pixel-perfect
 * popover-arrow math (fragile against dynamic content) — just a strong
 * highlight ring on the current target, scrolled into view, paired with a
 * fixed guide card. `beforeShow` plus a double requestAnimationFrame wait
 * lets a step change page state (switch a wizard step, open a panel) before
 * the highlight looks for its target, without this component needing to
 * know anything about the page it's running on.
 */
export function GuidedTour({
  steps,
  active,
  onClose,
}: {
  steps: TourStep[];
  active: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);

  // Reset to step 0 whenever the tour (re)opens. Adjusted during render
  // rather than in an effect — React's documented pattern for resetting
  // state on a prop change, since setState-in-effect triggers an avoidable
  // extra render pass.
  const [wasActive, setWasActive] = useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setIndex(0);
  }

  useEffect(() => {
    document
      .querySelectorAll(".tour-highlight")
      .forEach((el) => el.classList.remove("tour-highlight"));
    if (!active) return;

    const step = steps[index];
    if (!step) return;
    step.beforeShow?.();

    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const target = document.querySelector(step.selector);
        if (!target) return;
        target.classList.add("tour-highlight");
        const reduceMotion = window.matchMedia?.(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "center",
        });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [active, index, steps]);

  if (!active) return null;
  const step = steps[index];
  if (!step) return null;
  const isLast = index === steps.length - 1;

  return (
    <div className="tour-card" role="dialog" aria-label="Guided tour">
      <p className="tour-progress">
        Step {index + 1} of {steps.length}
      </p>
      <h3 className="tour-title">{step.title}</h3>
      <p className="tour-body">{step.body}</p>
      <div className="tour-actions">
        <button type="button" className="tour-skip" onClick={onClose}>
          Skip
        </button>
        <div className="tour-nav">
          {index > 0 && (
            <button type="button" onClick={() => setIndex((i) => i - 1)}>
              Back
            </button>
          )}
          <button
            type="button"
            className="tour-next"
            onClick={() => (isLast ? onClose() : setIndex((i) => i + 1))}
          >
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Drop-in button + tour, for a page that doesn't otherwise need tour state. */
export function TourLauncher({
  steps,
  label = "Take the tour",
  className = "tour-button",
}: {
  steps: TourStep[];
  label?: string;
  className?: string;
}) {
  const [active, setActive] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setActive(true)}>
        {label}
      </button>
      <GuidedTour steps={steps} active={active} onClose={() => setActive(false)} />
    </>
  );
}
