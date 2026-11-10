import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  loading?: boolean;
};

export default function Button({ variant = "primary", loading = false, className = "", children, disabled, ...rest }: Props) {
  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[17px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-brand text-white hover:bg-brand-dark"
      : "border-[1.5px] border-brand bg-white text-brand hover:bg-brand-light";
  return (
    <button className={`${base} ${styles} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && (
        <svg className="h-5 w-5 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}
