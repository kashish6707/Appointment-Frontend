"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import useSWR, { SWRConfig } from "swr";
import Logo from "@/components/Logo";
import { ApiError } from "@/lib/api";
import {
  addException,
  fetcher,
  keys,
  removeException,
  saveWeekly,
  type DoctorProfile,
  type ExceptionInput,
  type Schedule,
  type WeeklyDay,
} from "@/lib/doctorApi";
import { t } from "@/lib/strings";
import { hhmm, longDate, shortDate, todayIST } from "@/lib/time";
import { Card, ConfirmDialog, ErrorBox, pill, Skeleton, Toasts, type Toast } from "@/components/dashboard/ui";
import LogoutButton from "../dashboard/LogoutButton";

export default function ScheduleManager({ doctor }: { doctor: DoctorProfile }) {
  return (
    <SWRConfig value={{ fetcher }}>
      <Inner doctor={doctor} />
    </SWRConfig>
  );
}

/** A change that would cancel bookings, waiting for the doctor to confirm. */
type Pending = { count: number; dates: string[]; run: (confirm: boolean) => Promise<Schedule> };

function Inner({ doctor }: { doctor: DoctorProfile }) {
  const [clinicId, setClinicId] = useState(doctor.clinics[0]?.doctorClinicId);
  const { data, error, mutate } = useSWR<Schedule>(clinicId ? keys.schedule(clinicId) : null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(text: string, tone: Toast["tone"] = "info") {
    const id = Date.now();
    setToasts((ts) => [...ts.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 6000);
  }

  /** Run a change. If it would cancel bookings, ask first; return false if it didn't happen. */
  async function change(run: (confirm: boolean) => Promise<Schedule>): Promise<boolean> {
    try {
      done(await run(false));
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.code === "HAS_BOOKINGS") {
        setPending({ count: Number(err.data.count), dates: (err.data.dates as string[]) ?? [], run });
        return false;
      }
      throw err;
    }
  }
  function done(result: Schedule) {
    mutate(result, { revalidate: false });
    toast(result.cancelled ? t.schedule.cancelledInfo(result.cancelled, result.refunded ?? 0) : t.schedule.saved);
  }

  if (!clinicId) return <ErrorBox message="Add a clinic to your profile first." />;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo size={36} />
          <div className="flex items-center gap-3">
            <Link href="/doctor/dashboard" className="rounded-full px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light">← {t.schedule.back}</Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 pb-16 pt-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-brand-dark sm:text-[34px]">{t.schedule.title}</h1>
            <p className="mt-2 text-muted">{t.schedule.intro}</p>
          </div>
          {doctor.clinics.length > 1 && (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-muted">{t.schedule.clinic}</span>
              <select value={clinicId} onChange={(e) => setClinicId(e.target.value)} className="rounded-full border-[1.5px] border-line bg-white px-4 py-2 font-semibold">
                {doctor.clinics.map((c) => <option key={c.doctorClinicId} value={c.doctorClinicId}>{c.name}, {c.area}</option>)}
              </select>
            </label>
          )}
        </div>

        {error ? (
          <ErrorBox message={error.message} onRetry={() => mutate()} />
        ) : !data ? (
          <Skeleton className="h-96 rounded-[20px]" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex min-w-0 flex-col gap-6">
              <WeeklyEditor key={`${clinicId}-${JSON.stringify(data.weekly)}`} weekly={data.weekly} onSave={(days) => change((c) => saveWeekly(clinicId, days, c))} />
              <ExceptionsCard
                schedule={data}
                onAdd={(input) => change((c) => addException(clinicId, input, c))}
                onRemove={(date) => change((c) => removeException(clinicId, date, c)).catch((err) => toast(err instanceof ApiError ? err.message : t.common.loadError, "error"))}
              />
            </div>
            <UpcomingCard schedule={data} />
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!pending}
        title={t.schedule.confirmTitle}
        text={pending ? t.schedule.confirmText(pending.count, pending.dates.map((d) => shortDate(d)).join(", ")) : ""}
        confirmLabel={t.schedule.confirmButton}
        busy={confirmBusy}
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          setConfirmBusy(true);
          try {
            done(await pending.run(true));
          } catch (err) {
            toast(err instanceof ApiError ? err.message : t.common.loadError, "error");
          } finally {
            setConfirmBusy(false);
            setPending(null);
          }
        }}
      />
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((ts) => ts.filter((x) => x.id !== id))} />
    </div>
  );
}

function minutesEach(day: WeeklyDay): number | null {
  if (!day.open || !day.start || !day.end || !day.limit) return null;
  const [sh, sm] = day.start.split(":").map(Number);
  const [eh, em] = day.end.split(":").map(Number);
  const span = eh * 60 + em - (sh * 60 + sm);
  return span > 0 ? Math.round(span / day.limit) : null;
}

function WeeklyEditor({ weekly, onSave }: { weekly: WeeklyDay[]; onSave: (days: WeeklyDay[]) => Promise<boolean> }) {
  const [days, setDays] = useState<WeeklyDay[]>(weekly);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(i: number, patch: Partial<WeeklyDay>) {
    setDays((ds) => ds.map((d, j) => {
      if (j !== i) return d;
      const next = { ...d, ...patch };
      // Turning a day on: start from the nearest open day's hours.
      if (patch.open && !d.open) {
        const like = ds.find((x) => x.open);
        next.start = d.start ?? like?.start ?? "10:00";
        next.end = d.end ?? like?.end ?? "14:00";
        next.limit = d.limit ?? like?.limit ?? null;
      }
      return next;
    }));
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    for (const d of days) {
      if (!d.open) continue;
      if (!d.start || !d.end) e[d.weekday] = t.schedule.errors.times;
      else if (d.start >= d.end) e[d.weekday] = t.schedule.errors.hours;
      else if (d.limit != null && (!Number.isInteger(d.limit) || d.limit < 1 || d.limit > 500)) e[d.weekday] = t.schedule.errors.limit;
    }
    setErrors(e);
    setServerError("");
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await onSave(days.map((d) => (d.open ? d : { ...d, start: null, end: null, limit: null })));
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t.common.loadError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={t.schedule.weeklyTitle}>
      <p className="-mt-2 mb-4 text-sm text-muted">{t.schedule.weeklyHint}</p>
      <form onSubmit={submit} noValidate>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="text-sm text-muted">
                {[t.schedule.day, t.schedule.open, t.schedule.start, t.schedule.end, t.schedule.limit].map((h) => (
                  <th key={h} scope="col" className="border-b border-line px-2 pb-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d, i) => {
                const name = t.schedule.weekdayNames[d.weekday];
                const each = minutesEach(d);
                return (
                  <tr key={d.weekday} className={d.open ? "" : "text-muted"}>
                    <th scope="row" className="border-b border-line px-2 py-2.5 font-semibold">
                      {name}
                      {errors[d.weekday] && <span role="alert" className="block text-sm font-medium text-danger">{errors[d.weekday]}</span>}
                    </th>
                    <td className="border-b border-line px-2 py-2.5">
                      <input type="checkbox" aria-label={`${name}: ${t.schedule.open}`} checked={d.open} onChange={(e) => update(i, { open: e.target.checked })} className="h-5 w-5 accent-brand" />
                    </td>
                    <td className="border-b border-line px-2 py-2.5">
                      <input type="time" aria-label={`${name}: ${t.schedule.start}`} disabled={!d.open} value={d.start ?? ""} onChange={(e) => update(i, { start: e.target.value || null })}
                        className="rounded-xl border-[1.5px] border-line px-2.5 py-2 disabled:bg-brand-tint disabled:text-muted" />
                    </td>
                    <td className="border-b border-line px-2 py-2.5">
                      <input type="time" aria-label={`${name}: ${t.schedule.end}`} disabled={!d.open} value={d.end ?? ""} onChange={(e) => update(i, { end: e.target.value || null })}
                        className="rounded-xl border-[1.5px] border-line px-2.5 py-2 disabled:bg-brand-tint disabled:text-muted" />
                    </td>
                    <td className="border-b border-line px-2 py-2.5">
                      <input inputMode="numeric" aria-label={`${name}: ${t.schedule.limit}`} placeholder={t.schedule.noLimit} disabled={!d.open} value={d.limit ?? ""}
                        onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 3); update(i, { limit: v ? Number(v) : null }); }}
                        className="w-24 rounded-xl border-[1.5px] border-line px-2.5 py-2 disabled:bg-brand-tint" />
                      {each != null && <span className="block text-xs text-muted">{t.schedule.perPatient(each)}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {serverError && <p role="alert" className="mt-4 rounded-xl border-[1.5px] border-danger bg-danger-light px-4 py-3 font-medium text-danger">{serverError}</p>}
        <button type="submit" disabled={busy} className={`${pill.primary} mt-5`}>{busy ? t.schedule.saving : t.schedule.saveWeekly}</button>
      </form>
    </Card>
  );
}

function ExceptionsCard({ schedule, onAdd, onRemove }: {
  schedule: Schedule; onAdd: (input: ExceptionInput) => Promise<boolean>; onRemove: (date: string) => void;
}) {
  const today = todayIST();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState("");
  const [kind, setKind] = useState<"CLOSED" | "HOURS">("CLOSED");
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("14:00");
  const [limit, setLimit] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  // Default "different hours" to that weekday's regular hours.
  useEffect(() => {
    if (kind !== "HOURS") return;
    const d = schedule.upcoming.find((p) => p.date === from);
    if (d?.start && d.end) { setStart(d.start); setEnd(d.end); }
  }, [kind, from, schedule.upcoming]);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!from) e.from = t.schedule.errors.from;
    if (to && to < from) e.to = t.schedule.errors.to;
    if (kind === "HOURS" && (!start || !end || start >= end)) e.hours = t.schedule.errors.hours;
    const lim = limit ? Number(limit) : null;
    if (kind === "HOURS" && lim != null && (lim < 1 || lim > 500)) e.limit = t.schedule.errors.limit;
    setErrors(e);
    setServerError("");
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const ok = await onAdd({
        from, ...(to ? { to } : {}), kind, ...(note.trim() ? { note: note.trim() } : {}),
        ...(kind === "HOURS" ? { start, end, limit: lim } : {}),
      });
      if (ok) { setTo(""); setNote(""); setLimit(""); }
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t.common.loadError);
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) => errors[k] && <p className="mt-1.5 text-sm font-medium text-danger">{errors[k]}</p>;
  const input = "w-full rounded-xl border-[1.5px] border-line bg-white px-3 py-2.5 text-base focus:border-brand focus:outline-none";

  return (
    <Card title={t.schedule.exceptionsTitle}>
      <p className="-mt-2 mb-4 text-sm text-muted">{t.schedule.exceptionsHint}</p>

      {schedule.exceptions.length === 0 ? (
        <p className="mb-5 rounded-2xl bg-brand-tint px-4 py-3 text-muted">{t.schedule.noExceptions}</p>
      ) : (
        <ul className="mb-5 flex flex-col divide-y divide-line rounded-2xl border border-line">
          {schedule.exceptions.map((x) => (
            <li key={x.date} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block font-semibold">{longDate(x.date)}</span>
                <span className={`block text-sm ${x.kind === "CLOSED" ? "text-danger" : "text-[#6B4E00]"}`}>
                  {x.kind === "CLOSED" ? t.schedule.dayOff : t.schedule.hoursOn(hhmm(x.start!), hhmm(x.end!))}
                  {x.limit ? ` · ${t.schedule.limitOf(x.limit)}` : ""}
                  {x.note ? ` · ${x.note}` : ""}
                </span>
                <span className="block text-xs text-muted">{t.schedule.by(x.createdBy)}</span>
              </span>
              <button type="button" onClick={() => onRemove(x.date)} className="rounded-full border-[1.5px] border-line px-4 py-1.5 text-sm font-semibold text-ink hover:border-danger hover:text-danger">
                {t.schedule.remove}<span className="sr-only">: {longDate(x.date)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-2xl bg-brand-tint p-4">
        <fieldset>
          <legend className="mb-2 font-semibold">{t.schedule.kind}</legend>
          <div className="flex flex-wrap gap-2">
            {(["CLOSED", "HOURS"] as const).map((k) => (
              <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] bg-white px-4 py-2 font-semibold ${kind === k ? "border-brand text-brand-dark" : "border-line"}`}>
                <input type="radio" name="exception-kind" checked={kind === k} onChange={() => setKind(k)} className="accent-brand" />
                {k === "CLOSED" ? t.schedule.kindClosed : t.schedule.kindHours}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="exc-from" className="mb-1.5 block font-semibold">{t.schedule.from}</label>
            <input id="exc-from" type="date" min={today} value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
            {err("from")}
          </div>
          <div>
            <label htmlFor="exc-to" className="mb-1.5 block font-semibold">{t.schedule.to}</label>
            <input id="exc-to" type="date" min={from || today} value={to} onChange={(e) => setTo(e.target.value)} className={input} aria-describedby="exc-to-hint" />
            <p id="exc-to-hint" className="mt-1 text-xs text-muted">{t.schedule.toHint}</p>
            {err("to")}
          </div>
        </div>
        {kind === "HOURS" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="exc-start" className="mb-1.5 block font-semibold">{t.schedule.start}</label>
              <input id="exc-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="exc-end" className="mb-1.5 block font-semibold">{t.schedule.end}</label>
              <input id="exc-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="exc-limit" className="mb-1.5 block font-semibold">{t.schedule.limit}</label>
              <input id="exc-limit" inputMode="numeric" placeholder={t.schedule.noLimit} value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, "").slice(0, 3))} className={input} />
            </div>
            <div className="sm:col-span-3">{err("hours")}{err("limit")}</div>
          </div>
        )}
        <div>
          <label htmlFor="exc-note" className="mb-1.5 block font-semibold">{t.schedule.note}</label>
          <input id="exc-note" maxLength={200} placeholder={t.schedule.notePlaceholder} value={note} onChange={(e) => setNote(e.target.value)} className={input} />
        </div>
        {serverError && <p role="alert" className="rounded-xl border-[1.5px] border-danger bg-danger-light px-4 py-3 font-medium text-danger">{serverError}</p>}
        <button type="submit" disabled={busy} className={`${pill.primary} self-start`}>{busy ? t.schedule.saving : t.schedule.addException}</button>
      </form>
    </Card>
  );
}

function UpcomingCard({ schedule }: { schedule: Schedule }) {
  return (
    <Card title={t.schedule.upcomingTitle}>
      <p className="-mt-2 mb-4 text-sm text-muted">{t.schedule.upcomingHint(schedule.bookingWindowDays)}</p>
      <ul className="flex flex-col gap-2">
        {schedule.upcoming.map((d) => {
          const full = d.open && d.limit != null && d.booked >= d.limit;
          return (
            <li key={d.date} className={`rounded-2xl border px-4 py-3 ${d.open ? "border-line" : "border-dashed border-line bg-brand-tint"}`}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{shortDate(d.date)} <span className="font-normal text-muted">{longDate(d.date).split(",")[0].slice(0, 3)}</span></span>
                {!d.open ? (
                  <span className="text-sm font-semibold text-muted">{t.schedule.notAvailable}</span>
                ) : full ? (
                  <span className="text-sm font-semibold text-danger">{t.schedule.full}</span>
                ) : (
                  <span className="text-sm tabular-nums text-ink">{t.schedule.booked(d.booked, d.limit)}</span>
                )}
              </div>
              {d.open && d.start && d.end && (
                <p className={`text-sm ${d.exception === "HOURS" ? "font-medium text-[#6B4E00]" : "text-muted"}`}>{hhmm(d.start)} – {hhmm(d.end)}</p>
              )}
              {d.note && <p className="text-sm text-muted">{d.note}</p>}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
