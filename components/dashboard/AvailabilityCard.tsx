"use client";

import { useState } from "react";
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
};

export default function AvailabilityCard({ day, isToday, canReopen, canManage, canCall, busy, onAction }: Props) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const session = day.session;
  const status = session?.status;
  const canRun = isToday && !!session && status !== "CLOSED";
  const queueEmpty = day.stats.waiting === 0 && day.stats.withDoctor === 0;
  const plan = day.plan;

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
                <button type="button" className={pill.outline} disabled={!!busy} onClick={() => onAction("pause")}>{t.availability.pause}</button>
              )}
              {status === "ON_BREAK" && (
                <button type="button" className={pill.primary} disabled={!!busy} onClick={() => onAction("resume")}>{t.availability.resume}</button>
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
