import Link from "next/link";

const NAV_LINKS = [
  { href: "/apply", label: "Apply" },
  { href: "/dashboard", label: "Staff dashboard" },
  { href: "/schema", label: "Data dictionary" },
];

export function SiteHeader({ minimal = false }: { minimal?: boolean }) {
  return (
    <header className="border-b-4 border-[color:var(--color-blue)] bg-[color:var(--color-navy)] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white"
          >
            <span className="h-3 w-3 rounded-full bg-white" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Lifestage Benefits Optimization
          </span>
        </Link>
        {!minimal && (
          <nav aria-label="Primary" className="hidden gap-6 text-sm font-medium sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/85 transition hover:text-white hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
