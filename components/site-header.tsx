import Link from "next/link";

const NAV_LINKS = [
  { href: "/apply", label: "Apply" },
  { href: "/dashboard", label: "Staff dashboard" },
  { href: "/schema", label: "Data dictionary" },
  {
    href: "/under-the-hood",
    label: "Under the hood",
    tourId: "nav-under-the-hood",
  },
];

export function SiteHeader({ minimal = false }: { minimal?: boolean }) {
  return (
    <header className="usa-header usa-header--basic border-b-4 border-[color:var(--color-blue)] bg-[color:var(--color-navy)]">
      <div className="usa-nav-container mx-auto max-w-6xl px-6">
        <div className="usa-navbar">
          <div className="usa-logo" id="site-logo">
            <Link
              href="/"
              title="Lifestage Benefits Optimization home"
              className="flex items-center gap-3 text-lg font-semibold tracking-tight text-white no-underline hover:text-white"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white"
              >
                <span className="h-3 w-3 rounded-full bg-white" />
              </span>
              Lifestage Benefits Optimization
            </Link>
          </div>
          {!minimal && (
            <button type="button" className="usa-menu-btn">
              Menu
            </button>
          )}
        </div>
        {!minimal && (
          <nav aria-label="Primary navigation" className="usa-nav">
            <button type="button" className="usa-nav__close">
              <svg
                className="usa-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                aria-hidden="true"
                focusable="false"
                role="img"
              >
                <use href="/uswds/img/sprite.svg#close" />
              </svg>
            </button>
            <ul className="usa-nav__primary usa-accordion">
              {NAV_LINKS.map((link) => (
                <li key={link.href} className="usa-nav__primary-item">
                  <Link
                    href={link.href}
                    className="usa-nav__link"
                    data-tour={link.tourId}
                  >
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
