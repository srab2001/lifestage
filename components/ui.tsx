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
      className={`border border-[color:var(--color-border)] bg-white p-6 ${className}`}
    >
      {children}
    </div>
  );
}

const variants = {
  primary: "usa-button",
  secondary: "usa-button usa-button--outline",
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
    <div className="usa-form-group flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="usa-label m-0 font-semibold">
        {label}
      </label>
      {hint && <p className="usa-hint m-0">{hint}</p>}
      {children}
    </div>
  );
}

export const inputClass = "usa-input";
export const selectClass = "usa-select";
export const textareaClass = "usa-textarea";

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const tone =
    confidence >= 0.85
      ? "bg-green-100 text-green-800"
      : confidence >= 0.65
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";
  return (
    <span className={`usa-tag rounded-full normal-case ${tone}`}>{pct}%</span>
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
    <span
      className={`usa-tag bg-transparent border-2 normal-case tracking-wide ${tone}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Alert({
  type = "info",
  heading,
  children,
}: {
  type?: "info" | "success" | "warning" | "error";
  heading?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`usa-alert usa-alert--${type} usa-alert--slim`}>
      <div className="usa-alert__body">
        {heading && <h3 className="usa-alert__heading">{heading}</h3>}
        <p className="usa-alert__text">{children}</p>
      </div>
    </div>
  );
}
