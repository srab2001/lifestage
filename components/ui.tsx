import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded border border-[color:var(--color-border)] bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

const buttonBase =
  "inline-flex items-center justify-center rounded px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: `${buttonBase} bg-[color:var(--color-navy)] text-white hover:bg-[color:var(--color-navy-dark)]`,
  secondary: `${buttonBase} border-2 border-[color:var(--color-navy)] text-[color:var(--color-navy)] hover:bg-[color:var(--color-bg)]`,
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
}) {
  return <button className={`${variants[variant]} ${className}`} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-[color:var(--color-ink)]">
        {label}
      </label>
      {hint && <p className="text-xs text-[color:var(--color-muted)]">{hint}</p>}
      {children}
    </div>
  );
}

export const inputClass =
  "rounded border border-[color:var(--color-border)] px-3 py-2 text-sm focus:border-[color:var(--color-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-blue-light)]";

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const tone =
    confidence >= 0.85
      ? "bg-green-100 text-green-800"
      : confidence >= 0.65
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {pct}%
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "submitted" || status === "completed"
      ? "border-green-600 text-green-700"
      : status === "pending_third_party" || status === "sent" || status === "opened"
        ? "border-amber-600 text-amber-700"
        : "border-[color:var(--color-muted)] text-[color:var(--color-muted)]";
  return (
    <span className={`inline-block rounded-full border-2 px-3 py-0.5 text-xs font-bold uppercase tracking-wide ${tone}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
