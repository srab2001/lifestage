// The official U.S. government identifier banner (USWDS pattern), required
// at the top of every .gov-styled federal site. Interactivity (the
// expand/collapse toggle) is provided by uswds.min.js, loaded once in
// app/layout.tsx — this markup matches the USWDS reference implementation
// exactly so that script can find and enhance it.
export function GovBanner() {
  return (
    <div className="usa-banner">
      <div className="usa-accordion">
        <header className="usa-banner__header">
          <div className="usa-banner__inner">
            <div className="grid-col-auto">
              <img
                className="usa-banner__header-flag"
                src="/uswds/img/us_flag_small.png"
                alt="U.S. flag"
              />
            </div>
            <div className="grid-col-fill tablet:grid-col-auto" aria-hidden="true">
              <p className="usa-banner__header-text">
                An official website of the United States government
              </p>
              <p className="usa-banner__header-action">Here&apos;s how you know</p>
            </div>
            <button
              type="button"
              className="usa-accordion__button usa-banner__button"
              aria-expanded="false"
              aria-controls="gov-banner-default"
            >
              <span className="usa-banner__button-text">Here&apos;s how you know</span>
            </button>
          </div>
        </header>
        <div
          className="usa-banner__content usa-accordion__content"
          id="gov-banner-default"
          hidden
        >
          <div className="grid-row grid-gap-lg">
            <div className="usa-banner__guidance tablet:grid-col-6">
              <img
                className="usa-banner__icon usa-media-block__img"
                src="/uswds/img/icon-dot-gov.svg"
                role="img"
                alt=""
              />
              <div className="usa-media-block__body">
                <p>
                  <strong>Official websites use .gov</strong>
                  <br />A <strong>.gov</strong> website belongs to an official
                  government organization in the United States.
                </p>
              </div>
            </div>
            <div className="usa-banner__guidance tablet:grid-col-6">
              <img
                className="usa-banner__icon usa-media-block__img"
                src="/uswds/img/icon-https.svg"
                role="img"
                alt=""
              />
              <div className="usa-media-block__body">
                <p>
                  <strong>Secure .gov websites use HTTPS</strong>
                  <br />A <strong>lock</strong> (
                  <span className="icon-lock">
                    <svg
                      className="usa-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      aria-hidden="true"
                      focusable="false"
                      role="img"
                    >
                      <use href="/uswds/img/sprite.svg#lock" />
                    </svg>
                  </span>
                  ) or <strong>https://</strong> means you&apos;ve safely
                  connected to the .gov website. Share sensitive information
                  only on official, secure websites. This is a proof-of-concept
                  demo, not itself a .gov site — this banner demonstrates the
                  pattern a production build would carry.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
