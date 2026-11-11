"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import type { BookingStatus } from "@/lib/doctorApi";
import { t } from "@/lib/strings";

export function Card({ title, action, children, className = "", id }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} aria-label={typeof title === "string" ? title : undefined} className={`rounded-[20px] border border-line bg-white p-5 shadow-soft sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-bold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// Colour pairs from the design; each passes 4.5:1 for its text.
const CHIP: Record<BookingStatus, string> = {
  WAITING: "bg-[#EEF1F6] text-[#3E4459]",
  WITH_DOCTOR: "bg-token text-[#3A2A00]",
  DONE: "bg-brand-light text-brand-dark",
  SENT_FOR_TESTS: "bg-[#E6EEFA] text-[#1E4E9A]",
  NO_SHOW: "bg-danger-light text-[#9A2E22]",
  CANCELLED: "bg-danger-light text-[#9A2E22]",
};

export function StatusChip({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${CHIP[status]}`}>
      {t.status[status]}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-brand-tint motion-reduce:animate-none ${className}`} />;
}

export function ErrorBox({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-[1.5px] border-danger bg-danger-light px-4 py-3">
      <p className="font-medium text-danger">{message || t.common.loadError}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded-full border-[1.5px] border-danger bg-white px-4 py-1.5 text-sm font-semibold text-danger hover:bg-danger-light">
          {t.common.retry}
        </button>
      )}
    </div>
  );
}

/** Pill button styles shared by the dashboard. */
export const pill = {
  primary: "inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50",
  outline: "inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-brand bg-white px-5 py-2.5 font-semibold text-brand transition-colors hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-50",
  danger: "inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-danger bg-white px-5 py-2.5 font-semibold text-danger transition-colors hover:bg-danger-light disabled:cursor-not-allowed disabled:opacity-50",
};

/** In-page confirmation, using <dialog> so focus and Escape work without extra code. */
export function ConfirmDialog({ open, title, text, confirmLabel, busy, onConfirm, onCancel }: {
  open: boolean; title: string; text: string; confirmLabel: string; busy?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); onCancel(); }}
      aria-labelledby={titleId}
      className="w-[calc(100%-32px)] max-w-md rounded-[20px] border border-line p-6 text-ink shadow-soft backdrop:bg-ink/40"
    >
      <h2 id={titleId} className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-muted">{text}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onCancel} className={pill.outline}>{t.common.cancel}</button>
        <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex items-center justify-center rounded-full bg-danger px-5 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-50">
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export type Toast = { id: number; text: string; tone?: "info" | "error"; action?: { label: string; onClick: () => void } };

export function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-6 sm:translate-x-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.tone === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex items-start justify-between gap-3 rounded-2xl px-4 py-3 font-medium shadow-soft ${
            toast.tone === "error" ? "bg-danger text-white" : "bg-ink text-white"
          }`}
        >
          <span className="flex-1">{toast.text}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => { toast.action!.onClick(); onDismiss(toast.id); }}
              className="rounded-full bg-white px-3 py-0.5 text-sm font-bold text-ink hover:bg-brand-light"
            >
              {toast.action.label}
            </button>
          )}
          <button type="button" onClick={() => onDismiss(toast.id)} aria-label={t.common.close} className="-mr-1 rounded-full px-1.5 text-white/80 hover:text-white">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function initials(name: string) {
  const words = name.replace(/^dr\.?\s+/i, "").split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "");
}
