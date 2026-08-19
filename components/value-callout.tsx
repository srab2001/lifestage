/**
 * USWDS's usa-summary-box, used consistently across every demonstration
 * screen to answer one question a reviewer or a Veteran will actually
 * ask: what does this specific screen do for me? Two fixed rows (VA,
 * Veteran) rather than freeform content, so the answer stays scannable
 * and comparable screen to screen.
 */
export function ValueCallout({
  id,
  heading = "Why this matters",
  va,
  veteran,
}: {
  id: string;
  heading?: string;
  va: React.ReactNode;
  veteran: React.ReactNode;
}) {
  const headingId = `${id}-value-heading`;
  return (
    <div
      className="usa-summary-box value-callout"
      role="region"
      aria-labelledby={headingId}
    >
      <div className="usa-summary-box__body">
        <h3 className="usa-summary-box__heading" id={headingId}>
          {heading}
        </h3>
        <div className="usa-summary-box__text">
          <p className="value-callout__row">
            <strong>For the VA:</strong> {va}
          </p>
          <p className="value-callout__row">
            <strong>For the Veteran:</strong> {veteran}
          </p>
        </div>
      </div>
    </div>
  );
}
