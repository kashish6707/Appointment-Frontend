"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import useSWR from "swr";
import { ApiError } from "@/lib/api";
import {
  callPatient,
  correctPatient,
  keys,
  sendForTests,
  setBookingStatus,
  setTestStatus,
  type Booking,
  type BookingDetail,
  type Gender,
  type OpdSession,
  type Permission,
} from "@/lib/doctorApi";
import { t } from "@/lib/strings";
import { clockTime, longDate, shortDate, todayIST } from "@/lib/time";
import { TokenBadge } from "./Bookings";
import { ErrorBox, pill, Skeleton, StatusChip } from "./ui";

type Props = {
  /** The viewer's permissions (the backend checks them too). */
  can: (p: Permission) => boolean;
  bookingId: string | null;
  onClose: () => void;
  /** Called with whatever the server returned, so the dashboard updates at once. */
  onChanged: (change: { booking?: Booking; session?: OpdSession }) => void;
  onError: (message: string) => void;
};

/** Right-side drawer on desktop (520px), full screen on phones. Uses <dialog> for focus and Escape. */
export default function PatientPanel({ can, bookingId, onClose, onChanged, onError }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (bookingId && !d.open) d.showModal();
    if (!bookingId && d.open) d.close();
  }, [bookingId]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="panel-title"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-none overflow-hidden bg-white p-0 text-ink shadow-soft backdrop:bg-ink/40 md:w-[520px] md:rounded-l-[20px]"
    >
      {bookingId && <PanelBody key={bookingId} can={can} bookingId={bookingId} onClose={onClose} onChanged={onChanged} onError={onError} />}
    </dialog>
  );
}

function PanelBody({ can, bookingId, onClose, onChanged, onError }: Props & { bookingId: string }) {
  const { data, error, mutate } = useSWR<BookingDetail>(keys.booking(bookingId));
  const [busy, setBusy] = useState<string | null>(null);
  const [testsOpen, setTestsOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  async function run(label: string, action: () => Promise<{ booking?: Booking; session?: OpdSession }>) {
    setBusy(label);
    try {
      onChanged(await action());
      await mutate();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : t.common.loadError);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id="panel-title" className="text-lg font-bold">{t.panel.title}</h2>
        <button type="button" onClick={onClose} aria-label={t.common.close} autoFocus className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-brand-tint">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {error ? (
          <ErrorBox message={error.message} onRetry={() => mutate()} />
        ) : !data ? (
          <div className="flex flex-col gap-4" aria-label={t.panel.loading}>
            <Skeleton className="h-20" />
            <Skeleton className="h-24" />
            <Skeleton className="h-40" />
          </div>
        ) : editing ? (
          <CorrectionForm
            data={data}
            onCancel={() => setEditing(false)}
            onSaved={(detail) => {
              mutate(detail, { revalidate: false });
              onChanged({ booking: detail.booking });
              setEditing(false);
            }}
          />
        ) : (
          <Details
            data={data}
            can={can}
            busy={busy}
            onEdit={() => setEditing(true)}
            onTestToggle={(id, done) => run(`test-${id}`, async () => { await setTestStatus(id, done ? "DONE" : "PENDING"); return {}; })}
          />
        )}
      </div>

      {data && !editing && <Actions data={data} can={can} busy={busy} run={run} testsOpen={testsOpen} setTestsOpen={setTestsOpen} />}
    </div>
  );
}

function Details({ data, can, busy, onEdit, onTestToggle }: {
  data: BookingDetail; can: (p: Permission) => boolean; busy: string | null; onEdit: () => void; onTestToggle: (id: string, done: boolean) => void;
}) {
  const { booking, patient } = data;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <TokenBadge token={booking.token} size="lg" />
        <div className="min-w-0">
          <p className="text-xl font-bold leading-tight">{patient.name}</p>
          <p className="mt-0.5 text-muted">{t.visitType[booking.visitType]} · {t.source[booking.source]}</p>
          <p className="text-sm text-muted">
            {t.panel.bookedAt(clockTime(booking.bookedAt))}{booking.date !== todayIST() ? ` · ${shortDate(booking.date)}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusChip status={booking.status} />
            {data.queuePosition && <span className="text-sm font-semibold text-brand-dark">{t.panel.position(data.queuePosition)}</span>}
          </div>
        </div>
      </div>

      <Section title={t.panel.basic} action={can("patients.correct") ? (
        <button type="button" onClick={onEdit} className="text-sm font-semibold text-brand underline underline-offset-4">{t.correction.edit}</button>
      ) : undefined}>
        {data.correction && (
          <p className="mb-2.5 rounded-2xl bg-[#FDF6E7] px-4 py-2.5 text-sm text-[#5A4300]">
            {t.correction.correctedBy(data.correction.updatedBy, shortDate(data.correction.updatedAt.slice(0, 10)))}{" "}
            {t.correction.original(data.correction.original.name, data.correction.original.age, t.gender[data.correction.original.gender])}
          </p>
        )}
        <dl className="grid grid-cols-2 gap-2.5">
          <Tile label={t.panel.age} value={t.panel.years(patient.age)} />
          <Tile label={t.panel.gender} value={t.gender[patient.gender]} />
          <Tile label={t.panel.height} value={patient.heightCm ? t.panel.cm(patient.heightCm) : t.panel.notGiven} />
          <Tile label={t.panel.weight} value={patient.weightKg ? t.panel.kg(patient.weightKg) : t.panel.notGiven} />
        </dl>
        <div className="mt-2.5 flex items-center justify-between gap-3 rounded-2xl bg-brand-tint px-4 py-3">
          <div>
            <p className="text-sm text-muted">{t.panel.mobile}</p>
            <p className="font-semibold tabular-nums">{patient.phone ? `+91 ${patient.phone.slice(0, 5)} ${patient.phone.slice(5)}` : t.panel.noPhone}</p>
          </div>
          {patient.phone && (
            <a href={`tel:+91${patient.phone}`} className="rounded-full border-[1.5px] border-brand bg-white px-4 py-1.5 text-sm font-semibold text-brand hover:bg-brand-light">
              {t.panel.call}
            </a>
          )}
        </div>
      </Section>

      <Section title={t.panel.tests}>
        {data.tests.length === 0 ? (
          <p className="text-muted">{t.panel.noTests}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line">
            {data.tests.map((test) => {
              const done = test.status === "DONE";
              return (
                <li key={test.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <span className="min-w-0">
                    <span className="block font-semibold">{test.name}</span>
                    <span className="block text-sm text-muted">{shortDate(test.advisedOn)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${done ? "bg-brand-light text-brand-dark" : "bg-[#EEF1F6] text-[#3E4459]"}`}>
                      {done ? t.panel.testDone : t.panel.testPending}
                    </span>
                    {can("tests.manage") && <button
                      type="button"
                      disabled={busy === `test-${test.id}`}
                      onClick={() => onTestToggle(test.id, !done)}
                      className="rounded-full px-2 py-1 text-sm font-semibold text-brand underline underline-offset-4 disabled:opacity-50"
                    >
                      {done ? t.panel.markPending : t.panel.markDone}
                    </button>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title={t.panel.records}>
        {!data.recordsConsent ? (
          <p className="rounded-2xl border border-line bg-white px-4 py-3 text-muted">{t.panel.noConsent}</p>
        ) : !data.canViewRecords ? (
          <p className="rounded-2xl border border-line bg-white px-4 py-3 text-muted">{t.panel.noRecordsAccess}</p>
        ) : (
          <>
            {data.records.length === 0 ? (
              <p className="text-muted">{t.panel.noRecords}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line">
                {data.records.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{r.title}</span>
                      <span className="block text-sm text-muted">{t.panel.recordKind[r.kind]} · {shortDate(r.date)}</span>
                    </span>
                    <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border-[1.5px] border-brand px-4 py-1.5 text-sm font-semibold text-brand hover:bg-brand-light">
                      {t.panel.view}<span className="sr-only">: {r.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {data.recordsConsentAt && <p className="mt-2 text-sm text-muted">{t.panel.consentGiven(longDate(data.recordsConsentAt.slice(0, 10)))}</p>}
          </>
        )}
      </Section>
    </div>
  );
}

function Actions({ data, can, busy, run, testsOpen, setTestsOpen }: {
  data: BookingDetail;
  can: (p: Permission) => boolean;
  busy: string | null;
  run: (label: string, action: () => Promise<{ booking?: Booking; session?: OpdSession }>) => Promise<void>;
  testsOpen: boolean;
  setTestsOpen: (open: boolean) => void;
}) {
  const { booking, session } = data;
  const running = session.date === todayIST() && session.status === "IN_OPD";
  const settled = booking.status === "CANCELLED";
  const canCall = can("queue.call") && booking.status === "WAITING";
  const canTests = can("tests.manage");
  const canSeen = can("bookings.outcome");
  if (settled || (!canCall && !canTests && !canSeen)) return null;

  return (
    <div className="border-t border-line bg-white px-5 py-4">
      {testsOpen ? (
        <TestsForm
          busy={busy === "tests"}
          onCancel={() => setTestsOpen(false)}
          onSubmit={(names) =>
            run("tests", async () => {
              const r = await sendForTests(booking.id, names);
              setTestsOpen(false);
              return { booking: r.booking };
            })
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {canCall && (
            <button type="button" className={pill.primary} disabled={!running || !!busy} onClick={() => run("call", async () => {
              const r = await callPatient(booking.id);
              return { booking: r.current ?? undefined, session: r.session };
            })}>
              {t.panel.callIn}
            </button>
          )}
          {(canTests || canSeen) && (
            <div className={`grid gap-2.5 ${canTests && canSeen ? "grid-cols-2" : "grid-cols-1"}`}>
              {canTests && <button type="button" className={pill.outline} disabled={!!busy} onClick={() => setTestsOpen(true)}>{t.panel.sendForTests}</button>}
              {canSeen && (
                <button type="button" className={pill.outline} disabled={!!busy || booking.status === "DONE"} onClick={() => run("seen", async () => ({ booking: await setBookingStatus(booking.id, "DONE") }))}>
                  {t.panel.markSeen}
                </button>
              )}
            </div>
          )}
          {canCall && !running && <p className="text-center text-sm text-muted">{t.panel.actionsUnavailable}</p>}
        </div>
      )}
    </div>
  );
}

function TestsForm({ busy, onCancel, onSubmit }: { busy: boolean; onCancel: () => void; onSubmit: (names: string[]) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  function submit(ev: FormEvent) {
    ev.preventDefault();
    const names = text.split(/[\n,]/).map((n) => n.trim()).filter(Boolean);
    if (names.length < 1 || names.length > 10 || names.some((n) => n.length < 2 || n.length > 100)) {
      setError(t.panel.testNamesError);
      return;
    }
    setError("");
    onSubmit(names);
  }
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <div>
        <label htmlFor="test-names" className="mb-1.5 block font-semibold">{t.panel.testNamesLabel}</label>
        <textarea
          id="test-names"
          rows={3}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "test-names-error" : "test-names-hint"}
          className={`w-full rounded-xl border-[1.5px] px-3.5 py-3 text-base focus:border-brand focus:outline-none ${error ? "border-danger" : "border-line"}`}
        />
        {error ? (
          <p id="test-names-error" className="mt-1.5 text-sm font-medium text-danger">{error}</p>
        ) : (
          <p id="test-names-hint" className="mt-1.5 text-sm text-muted">{t.panel.testNamesHint}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" onClick={onCancel} className={pill.outline}>{t.common.cancel}</button>
        <button type="submit" disabled={busy} className={pill.primary}>{busy ? t.panel.sending : t.panel.send}</button>
      </div>
    </form>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-brand-tint px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

/** Correct name, age, gender (this doctor's team only) and this visit's height and weight. */
function CorrectionForm({ data, onCancel, onSaved }: { data: BookingDetail; onCancel: () => void; onSaved: (d: BookingDetail) => void }) {
  const p = data.patient;
  const [name, setName] = useState(p.name);
  const [age, setAge] = useState(String(p.age));
  const [gender, setGender] = useState<Gender>(p.gender);
  const [height, setHeight] = useState(p.heightCm != null ? String(p.heightCm) : "");
  const [weight, setWeight] = useState(p.weightKg != null ? String(p.weightKg) : "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    const ageNum = Number(age);
    const h = height.trim() === "" ? null : Number(height);
    const w = weight.trim() === "" ? null : Number(weight);
    if (name.trim().length < 2) e.name = t.correction.errors.name;
    if (age === "" || !Number.isInteger(ageNum) || ageNum < 0 || ageNum > 120) e.age = t.correction.errors.age;
    if (h !== null && (!Number.isFinite(h) || h < 30 || h > 250)) e.height = t.correction.errors.height;
    if (w !== null && (!Number.isFinite(w) || w < 1 || w > 300)) e.weight = t.correction.errors.weight;
    setErrors(e);
    setServerError("");
    if (Object.keys(e).length) {
      document.getElementById(`fix-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    // Send only what changed, so nothing is corrected by accident.
    const input: Parameters<typeof correctPatient>[1] = {};
    if (name.trim() !== p.name) input.name = name.trim();
    if (ageNum !== p.age) input.age = ageNum;
    if (gender !== p.gender) input.gender = gender;
    if (h !== p.heightCm) input.heightCm = h;
    if (w !== p.weightKg) input.weightKg = w;
    if (Object.keys(input).length === 0) return onCancel();
    setBusy(true);
    try {
      onSaved(await correctPatient(data.booking.id, input));
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t.common.loadError);
      setBusy(false);
    }
  }

  const field = (id: string, label: string, value: string, set: (v: string) => void, extra: Record<string, unknown> = {}) => (
    <div>
      <label htmlFor={`fix-${id}`} className="mb-1.5 block font-semibold">{label}</label>
      <input
        id={`fix-${id}`}
        value={value}
        onChange={(e) => set(e.target.value)}
        aria-invalid={errors[id] ? true : undefined}
        aria-describedby={errors[id] ? `fix-${id}-error` : undefined}
        className={`w-full rounded-xl border-[1.5px] px-3.5 py-3 text-base focus:border-brand focus:outline-none ${errors[id] ? "border-danger" : "border-line"}`}
        {...extra}
      />
      {errors[id] && <p id={`fix-${id}-error`} className="mt-1.5 text-sm font-medium text-danger">{errors[id]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-bold">{t.correction.title}</h3>
        <p className="mt-1 text-sm text-muted">{t.correction.hint}</p>
      </div>
      {field("name", t.walkIn.name, name, setName, { autoComplete: "off" })}
      <div className="grid grid-cols-2 gap-3">
        {field("age", t.walkIn.age, age, (v) => setAge(v.replace(/\D/g, "")), { inputMode: "numeric", maxLength: 3 })}
        <div>
          <label htmlFor="fix-gender" className="mb-1.5 block font-semibold">{t.walkIn.gender}</label>
          <select id="fix-gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)} className="w-full rounded-xl border-[1.5px] border-line bg-white px-3 py-3 text-base focus:border-brand focus:outline-none">
            {(Object.keys(t.gender) as Gender[]).map((g) => <option key={g} value={g}>{t.gender[g]}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {field("height", t.correction.heightLabel, height, setHeight, { inputMode: "decimal" })}
        {field("weight", t.correction.weightLabel, weight, setWeight, { inputMode: "decimal" })}
      </div>
      <p className="-mt-2 text-sm text-muted">{t.correction.measuredHint}</p>
      <p className="rounded-2xl bg-brand-tint px-4 py-3 text-sm text-muted">{t.correction.phoneNote}</p>
      {serverError && <p role="alert" className="rounded-xl border-[1.5px] border-danger bg-danger-light px-4 py-3 font-medium text-danger">{serverError}</p>}
      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" onClick={onCancel} className={pill.outline}>{t.common.cancel}</button>
        <button type="submit" disabled={busy} className={pill.primary}>{busy ? t.correction.saving : t.correction.save}</button>
      </div>
    </form>
  );
}
