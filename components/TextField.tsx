import type { InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
};

export default function TextField({ id, label, error, hint, prefix, suffix, className = "", ...rest }: Props) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-semibold text-ink">
        {label}
      </label>
      <div
        className={`flex items-center overflow-hidden rounded-xl border-[1.5px] bg-white transition-colors focus-within:border-brand ${
          error ? "border-danger" : "border-line"
        }`}
      >
        {prefix && <span className="flex h-full items-center border-r border-line bg-brand-tint px-3 py-3 font-semibold text-muted">{prefix}</span>}
        <input
          id={id}
          className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-base text-ink placeholder:text-muted/70 focus:outline-none"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {suffix}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
