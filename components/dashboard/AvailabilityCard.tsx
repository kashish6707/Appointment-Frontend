"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Dashboard, SessionAction } from "@/lib/doctorApi";
import { t } from "@/lib/strings";
import { clockTime, hhmm } from "@/lib/time";
import { ConfirmDialog, pill } from "./ui";

const DOT: Record<string, string> = {
  NOT_STARTED: "bg-muted",
  IN_OPD: "bg-brand",
  ON_BREAK: "bg-token",
  CLOSED: "bg-danger",
};

type Props = {
  day: Dashboard;
  isToday: boolean;
  /** Today or a coming day: a closed session can still be reopened. */
  canReopen: boolean;
  /** Permissions: opd.manage (start/pause/end/reopen) and queue.call (call next). */
  canManage: boolean;
  canCall: boolean;
  busy: SessionAction | null;
  onAction: (action: SessionAction) => Promise<boolean>;
  /** Take a break of a set length, or add time to the current one. */
  onBreak: (minutes: number) => Promise<boolean>;
  onExtend: (minutes: number) => Promise<boolean>;
};

const BREAK_CHOICES = [10, 15, 20, 30, 45, 60];

/** Minutes until `iso` (negative once it has passed), refreshed every 20 seconds. */
function useMinutesUntil(iso: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!iso) return;
    const id = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(id);
  }, [iso]);
  return iso ? Math.round((new Date(iso).getTime() - now) / 60_000) : null;
}

export default function AvailabilityCard({ day, isToday, canReopen, canManage, canCall, busy, onAction, onBreak, onExtend }: Props) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [askBreak, setAskBreak] = useState(false);
  const session = day.session;
  const status = session?.status;
  const canRun = isToday && !!session && status !== "CLOSED";
  const queueEmpty = day.stats.waiting === 0 && day.stats.withDoctor === 0;
  const plan = day.plan;
  const breakLeft = useMinutesUntil(status === "ON_BREAK" ? session?.breakUntil ?? null : null);

  let nextHint = "";
  if (!canRun) nextHint = "";
  else if (status === "NOT_STARTED") nextHint = t.availability.startFirst;
  else if (status === "ON_BREAK") nextHint = t.availability.onBreak;
  else if (queueEmpty) nextHint = t.availability.nobodyWaiting;

  return (
    <section aria-label={t.availability.title} className="rounded-[20px] border border-line bg-white p-5 shadow-soft sm:p-6">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          {session && status ? (
            <>
              <p className="flex items-center gap-2.5 text-xl font-bold text-ink">
                <span aria-hidden="true" className={`h-3 w-3 rounded-full ${DOT[status]} ${status === "IN_OPD" ? "ring-4 ring-brand-light" : ""}`} />
                {t.availability.status[status]}
              </p>
              {status === "ON_BREAK" && session.breakUntil && breakLeft !== null && (
                <p className={`mt-1 font-semibold ${breakLeft < 0 ? "text-danger" : "text-[#6B4E00]"}`} aria-live="polite">
                  {breakLeft < 0
                    ? t.availability.overrun(-breakLeft)
                    : `${t.availability.backAt(clockTime(session.breakUntil))} · ${t.availability.minutesLeft(breakLeft)}`}
                </p>
              )}
              <p className="mt-1 text-muted">
                {status === "CLOSED" && session.closedAt
                  ? t.availability.endedAt(clockTime(session.closedAt))
                  : session.startedAt
                    ? t.availability.startedAt(clockTime(session.startedAt))
                    : plan.start && plan.end
                      ? t.availability.hours(hhmm(plan.start), hhmm(plan.end))
                      : t.availability.hours(hhmm(day.clinic.opdStart), hhmm(day.clinic.opdEnd))}
              </p>
              {plan.exception === "HOURS" && <p className="mt-0.5 text-sm font-medium text-[#6B4E00]">{t.availability.changedHours(plan.note)}</p>}
              {plan.exception === "CLOSED" && <p className="mt-0.5 text-sm font-medium text-danger">{t.availability.away(plan.note)}</p>}
              {plan.limit != null && plan.open && (
                <p className={`mt-0.5 text-sm font-medium ${day.stats.booked >= plan.limit ? "text-danger" : "text-brand-dark"}`}>
                  {t.availability.limit(day.stats.booked, plan.limit)}
                </p>
              )}
            </>
          ) : (
            <p className="text-lg font-semibold text-muted">
              {plan.exception === "CLOSED" ? t.availability.away(plan.note) : t.availability.noOpd}
            </p>
          )}
          {session && !isToday && status !== "CLOSED" && <p className="mt-1 text-sm text-muted">{t.availability.notToday}</p>}
          {canRun && status === "NOT_STARTED" && canManage && (
            <p className="mt-1 text-sm text-muted">{t.availability.willNotify(day.stats.waiting)}</p>
          )}
          {status !== "NOT_STARTED" && day.notifications && t.availability.notifySummary(day.notifications) && (
            <p className="mt-1 text-sm text-muted">
              {t.availability.notifyLabel} <span className="font-medium text-ink">{t.availability.notifySummary(day.notifications)}</span>
            </p>
          )}

          {status === "CLOSED" && canReopen && canManage && (
            <div className="mt-4 flex flex-col items-start gap-1.5">
              <button type="button" className={pill.outline} disabled={!!busy} onClick={() => onAction("reopen")}>
                {busy === "reopen" ? t.availability.reopening : t.availability.reopen}
              </button>
              <p className="text-sm text-muted">{t.availability.reopenHint}</p>
            </div>
          )}

          {canRun && canManage && (
            <div className="mt-4 flex flex-wrap gap-2.5">
              {status === "NOT_STARTED" && (
                <button type="button" className={pill.primary} disabled={!!busy} onClick={() => onAction("start")}>{t.availability.start}</button>
              )}
              {status === "IN_OPD" && (
                <button type="button" className={pill.outline} disabled={!!busy} onClick={() => setAskBreak(true)}>{t.availability.pause}</button>
              )}
              {status === "ON_BREAK" && (
                <>
                  <button type="button" className={pill.primary} disabled={!!busy} onClick={() => onAction("resume")}>{t.availability.resume}</button>
                  <button type="button" className={pill.outline} disabled={!!busy} onClick={() => onExtend(10)}>{t.availability.addTime(10)}</button>
                </>
              )}
              {(status === "IN_OPD" || status === "ON_BREAK") && (
                <button type="button" className={pill.danger} disabled={!!busy} onClick={() => setConfirmEnd(true)}>{t.availability.end}</button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-stretch gap-4 sm:flex-nowrap">
          <div className="flex min-w-[124px] flex-1 flex-col items-center justify-center rounded-2xl bg-[#FDF6E7] px-5 py-3 text-center ring-1 ring-token/40 sm:flex-none">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B4E00]">{t.availability.nowServing}</span>
            <span className="text-[40px] font-bold leading-none tabular-nums text-[#3A2A00]" aria-live="polite">
              {session?.currentToken ?? t.availability.nobody}
            </span>
          </div>
          {canRun && canCall && (
            <div className="flex flex-1 flex-col justify-center gap-1.5 sm:min-w-[220px]">
              <button
                type="button"
                onClick={() => onAction("next")}
                disabled={!!busy || status !== "IN_OPD" || queueEmpty}
                className="inline-flex min-h-[64px] w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-lg font-bold text-white shadow-soft transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "next" ? t.availability.calling : t.availability.callNext}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
              {nextHint && <p className="text-center text-sm text-muted">{nextHint}</p>}
            </div>
          )}
        </div>
      </div>

      <BreakDialog
        open={askBreak}
        busy={busy === "pause"}
        onCancel={() => setAskBreak(false)}
        onConfirm={async (minutes) => {
          if (await onBreak(minutes)) setAskBreak(false);
        }}
      />
      <ConfirmDialog
        open={confirmEnd}
        title={t.availability.endConfirmTitle}
        text={t.availability.endConfirmText}
        confirmLabel={t.availability.endConfirm}
        busy={busy === "end"}
        onCancel={() => setConfirmEnd(false)}
        onConfirm={async () => {
          await onAction("end");
          setConfirmEnd(false);
        }}
      />
    </section>
  );
}

export function StatTiles({ day }: { day: Dashboard }) {
  const s = day.stats;
  const tiles = [
    {
      key: "booked",
      label: t.stats.booked,
      value: s.booked,
      suffix: day.plan.limit != null ? t.stats.ofLimit(day.plan.limit) : undefined,
      note: t.stats.split(s.online, s.walkIn),
    },
    { key: "waiting", label: t.stats.waiting, value: s.waiting },
    { key: "seen", label: t.stats.seen, value: s.seen },
    { key: "tests", label: t.stats.sentForTests, value: s.sentForTests },
    { key: "cancelled", label: t.stats.cancelled, value: s.cancelled },
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-5" aria-label="Day summary">
      {tiles.map((tile, i) => (
        <li key={tile.key} className={`rounded-[20px] bg-brand-tint px-4 py-4 ${i === 0 ? "col-span-2 md:col-span-1" : ""}`}>
          <p className="text-sm font-semibold text-muted">{tile.label}</p>
          <p className="mt-1 text-[32px] font-bold leading-none tabular-nums text-brand-dark">
            {tile.value}
            {"suffix" in tile && tile.suffix && <span className="ml-1.5 text-base font-semibold text-muted">{tile.suffix}</span>}
          </p>
          {tile.note && <p className="mt-1.5 text-sm text-muted">{tile.note}</p>}
        </li>
      ))}
    </ul>
  );
}

/** Choose how long the break is. Uses <dialog> so focus and Escape work. */
function BreakDialog({ open, busy, onCancel, onConfirm }: { open: boolean; busy: boolean; onCancel: () => void; onConfirm: (minutes: number) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [choice, setChoice] = useState<number | "other">(15);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setError("");
      d.showModal();
    }
    if (!open && d.open) d.close();
  }, [open]);

  function submit(ev: FormEvent) {
    ev.preventDefault();
    const minutes = choice === "other" ? Number(custom) : choice;
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 180) {
      setError(t.availability.breakCustomError);
      document.getElementById("break-custom")?.focus();
      return;
    }
    onConfirm(minutes);
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="break-title"
      onCancel={(e) => { e.preventDefault(); onCancel(); }}
      className="w-[calc(100%-32px)] max-w-md rounded-[20px] border border-line p-6 text-ink shadow-soft backdrop:bg-ink/40"
    >
      <form onSubmit={submit} noValidate>
        <h2 id="break-title" className="text-xl font-bold">{t.availability.breakTitle}</h2>
        <p className="mt-2 text-muted">{t.availability.breakText}</p>
        <div role="radiogroup" aria-labelledby="break-title" className="mt-5 grid grid-cols-3 gap-2">
          {BREAK_CHOICES.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={choice === m}
              onClick={() => { setChoice(m); setError(""); }}
              className={`rounded-full border-[1.5px] py-2.5 font-semibold transition-colors ${choice === m ? "border-brand bg-brand text-white" : "border-line hover:border-brand"}`}
            >
              {t.availability.breakMinutes(m)}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <label htmlFor="break-custom" className="mb-1.5 block font-semibold">{t.availability.breakCustom}</label>
          <input
            id="break-custom"
            inputMode="numeric"
            maxLength={3}
            placeholder="25"
            value={custom}
            onFocus={() => setChoice("other")}
            onChange={(e) => { setCustom(e.target.value.replace(/\D/g, "")); setChoice("other"); setError(""); }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "break-custom-error" : undefined}
            className={`w-32 rounded-xl border-[1.5px] px-3.5 py-2.5 text-base focus:border-brand focus:outline-none ${choice === "other" ? "border-brand" : "border-line"}`}
          />
          {error && <p id="break-custom-error" className="mt-1.5 text-sm font-medium text-danger">{error}</p>}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className={pill.outline}>{t.common.cancel}</button>
          <button type="submit" disabled={busy} className={pill.primary}>{t.availability.breakStart}</button>
        </div>
      </form>
    </dialog>
  );
}
