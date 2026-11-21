"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { forgetToken, loadTokens, saveToken } from "@/lib/myTokens";
import { cancelBooking, getAvailability, getTracking, rescheduleBooking, trackingPath, type BookingDay, type Tracking } from "@/lib/patientApi";
import { addDays, clockTime, longDate, shortTime, todayIST } from "@/lib/time";
import { alertPatient, askForNotifications, notificationsAllowed, notificationsSupported, unlockSound } from "@/lib/queueAlert";
import { useTrackingLive } from "@/lib/useTrackingLive";
import { useAccount } from "./AccountProvider";
import { ClockIcon } from "./icons";
import PatientHeader from "./PatientHeader";

const POLL_MS = 60_000; // in case live updates are blocked on the patient's network

/** A patient's token and the queue, live. Opened from the booking, "My tokens" or a shared link. */
export default function TrackScreen({ bookingId, code }: { bookingId: string; code: string }) {
  const { t } = useLang();
  const [data, setData] = useState<Tracking | null>(null);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [changing, setChanging] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStage = useRef<string | null>(null);
  const tRef = useRef(t);
  tRef.current = t;
  const { me } = useAccount();
  const signedOut = useRef(false);
  signedOut.current = me === null;

  const load = useCallback(async () => {
    if (!code) return setError(t.track.notFound);
    try {
      const r = await getTracking(bookingId, code);
      // Alert once when the patient becomes next, and when they're called in.
      const stage = r.status === "WITH_DOCTOR" ? "called" : r.status === "WAITING" && r.sessionStatus === "IN_OPD" && r.patientsAhead === 0 ? "next" : "waiting";
      if (lastStage.current && stage !== lastStage.current && stage !== "waiting") {
        alertPatient(stage === "called" ? tRef.current.track.alertCalledTitle : tRef.current.track.alertNextTitle,
          stage === "called" ? tRef.current.track.withDoctor : tRef.current.track.alertNextBody(r.doctorName));
      }
      lastStage.current = stage;
      setData(r);
      setError("");
      setUpdatedAt(new Date());
      // Not signed in: keep it in "My tokens" on this device, e.g. when opened from a shared link.
      // (Not a cancelled one: e.g. after "Change day" the old token is gone from the list.)
      if (signedOut.current && r.status !== "CANCELLED" && !loadTokens().some((x) => x.bookingId === bookingId)) {
        saveToken({ bookingId, code, token: r.token, date: r.date, doctorName: r.doctorName, clinicName: r.clinicName, patientName: "" });
      }
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? t.track.notFound : e instanceof ApiError ? e.message : t.common.loadError);
    }
  }, [bookingId, code, t.track.notFound, t.common.loadError]);

  // Several events can arrive together (a patient called in, the queue moved): fetch once.
  const refresh = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(load, 250);
  }, [load]);

  useEffect(() => {
    // Sound needs one tap on the page first (browser rule).
    window.addEventListener("pointerdown", unlockSound, { once: true });
    return () => window.removeEventListener("pointerdown", unlockSound);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const active = !!data && ["WAITING", "WITH_DOCTOR", "PENDING_PAYMENT"].includes(data.status) && data.sessionStatus !== "CLOSED";
  const { connected } = useTrackingLive(bookingId, code, refresh, active);

  const link = typeof window !== "undefined" ? window.location.href : "";
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard blocked: the WhatsApp button still works */
    }
  }

  async function cancel() {
    setCancelling(true);
    try {
      await cancelBooking(bookingId, code);
      dialog.current?.close();
      await load();
    } catch (e) {
      dialog.current?.close();
      setError(e instanceof ApiError ? e.message : t.common.loadError);
    } finally {
      setCancelling(false);
    }
  }

  let content;
  if (error && !data) {
    content = (
      <div role="alert" className="rounded-[22px] border-[1.5px] border-danger bg-danger-light px-4 py-4">
        <p className="font-medium text-danger">{error}</p>
        <button type="button" onClick={load} className="mt-3 min-h-[44px] rounded-full border-[1.5px] border-danger bg-white px-4 font-semibold text-danger">{t.common.retry}</button>
      </div>
    );
  } else if (!data) {
    content = <div className="h-[360px] animate-pulse rounded-[22px] bg-brand-tint motion-reduce:animate-none" aria-label={t.list.loading} />;
  } else {
    const isToday = data.date === todayIST();
    const waiting = data.status === "WAITING";
    const ahead = data.patientsAhead ?? 0;
    const running = isToday && data.sessionStatus === "IN_OPD";
    const breakLeft = data.breakUntil ? Math.max(1, Math.round((new Date(data.breakUntil).getTime() - Date.now()) / 60000)) : null;
    const wait = data.estimatedMinutes != null && data.estimatedMinutes >= 5 ? data.estimatedMinutes : null;

    // Where things stand, in plain words: a headline and up to two lines under it.
    let headline: string;
    const lines: string[] = [];
    let tone: "brand" | "amber" | "muted" | "danger" | "next" = "brand";
    if (data.status === "WITH_DOCTOR") (headline = t.track.withDoctor), (tone = "next");
    else if (data.status === "DONE") (headline = t.track.done), (tone = "muted");
    else if (data.status === "SENT_FOR_TESTS") (headline = t.track.sentForTests), (tone = "amber");
    else if (data.status === "NO_SHOW") (headline = t.track.noShow), (tone = "danger");
    else if (data.status === "CANCELLED") (headline = t.track.cancelled), (tone = "muted");
    else if (data.status === "PENDING_PAYMENT" || data.status === "PAYMENT_FAILED") (headline = t.track.pending), (tone = "amber");
    else if (data.sessionStatus === "CLOSED") (headline = t.track.closed), (tone = "muted");
    else if (!isToday) (headline = t.track.future(longDate(data.date))), (tone = "muted");
    else if (data.sessionStatus === "NOT_STARTED") {
      headline = t.track.notStarted(shortTime(data.opdStart));
      tone = "amber";
      lines.push(t.track.beforeYou(ahead));
    } else if (data.sessionStatus === "ON_BREAK") {
      headline = t.track.onBreakFor(breakLeft, data.breakUntil ? clockTime(data.breakUntil) : null);
      tone = "amber";
      lines.push(t.track.beforeYou(ahead));
    } else if (ahead === 0) {
      headline = t.track.youreNext;
      tone = "next";
      if (data.withDoctor != null) lines.push(t.track.doctorWith(data.withDoctor));
    } else {
      headline = data.withDoctor != null ? t.track.doctorWith(data.withDoctor) : t.track.opdRunning;
      lines.push(t.track.yourTurnAfter(ahead));
      if (wait != null && data.expectedAt) lines.push(t.track.expectedIn(shortTime(data.expectedAt), wait));
    }

    const toneClass = {
      brand: "bg-brand-light text-brand-dark",
      amber: "bg-[#FFF4DE] text-[#7A4B00]",
      muted: "bg-brand-tint text-muted",
      danger: "bg-danger-light text-danger",
      next: "bg-brand text-white",
    }[tone];
    const shareText = t.track.shareText(data.token ?? "–", data.doctorName, link);

    content = (
      <div className="flex flex-col gap-4">
        <section className="overflow-hidden rounded-[22px] border border-line bg-white shadow-soft">
          <div className="flex items-center justify-between gap-4 border-b border-dashed border-line px-5 py-4">
            <div className="min-w-0">
              <p className="text-lg font-bold text-ink">{data.doctorName}</p>
              <p className="text-[15px] text-muted">{data.clinicName}</p>
              <p className="mt-1 text-[15px] font-semibold text-ink">{longDate(data.date)}</p>
              {data.slotStart && data.slotEnd && (
                <p className="text-[15px] font-semibold text-brand-dark">{t.track.yourTime(`${shortTime(data.slotStart)} – ${shortTime(data.slotEnd)}`)}</p>
              )}
            </div>
            <div className="shrink-0 text-center">
              <p className="text-sm font-semibold text-muted">{t.track.tokenLabel}</p>
              <p className="text-[56px] font-extrabold leading-none text-brand-dark sm:text-[64px]">{data.token ?? "–"}</p>
            </div>
          </div>
          <div className={`px-5 py-4 ${toneClass}`} aria-live="polite" role={tone === "next" ? "alert" : undefined}>
            <p className={`font-bold leading-snug ${tone === "next" ? "text-[22px]" : "text-[19px]"}`}>{headline}</p>
            {lines.map((l) => <p key={l} className="mt-1 text-[16px] font-semibold opacity-90">{l}</p>)}
            {running && waiting && ahead > 0 && wait != null && !data.expectedAt && (
              <p className="mt-1 inline-flex items-center gap-1.5 text-[15px] font-semibold"><ClockIcon size={18} /> {t.track.wait(wait)}</p>
            )}
          </div>
        </section>

        {active && waiting && isToday && (
          <AlertButton />
        )}

        {active && waiting && (data.whatsapp === "OFF" || data.whatsapp === "FAILED") && (
          <div role="status" className="rounded-[22px] border border-[#F2C7A2] bg-[#FFF4DE] px-5 py-4 text-[#7A4B00]">
            <p className="font-bold">{data.whatsapp === "FAILED" ? t.track.whatsappFailedTitle : t.track.noWhatsappTitle}</p>
            <p className="mt-1 text-[15px]">{t.track.noWhatsappBody}</p>
          </div>
        )}

        {active && (
          <p className="flex items-center justify-center gap-2 text-sm text-muted">
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-brand motion-safe:animate-pulse" : "bg-[#C98A00]"}`} aria-hidden="true" />
            {connected ? t.track.live : t.track.reconnecting}
            {updatedAt && <span>· {t.track.updated(clockTime(updatedAt.toISOString()))}</span>}
          </p>
        )}
        {error && <p role="alert" className="rounded-xl bg-danger-light px-4 py-3 font-medium text-danger">{error}</p>}

        {data.dayNote && <p className="rounded-xl bg-brand-tint px-4 py-3 text-[15px] text-ink">{data.dayNote}</p>}

        {!!data.messages?.length && (
          <section aria-labelledby="msg-title" className="rounded-[22px] border border-line bg-white px-5 py-4">
            <h2 id="msg-title" className="font-bold text-ink">{t.track.messages}</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {data.messages.map((m, i) => (
                <li key={i} className="text-[15px] text-ink">
                  {m.text} <span className="text-sm text-muted">· {clockTime(m.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {active && (
          <>
            <p className="text-center text-[15px] text-muted">{t.track.saveHint}</p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#1F8A4C] px-5 font-semibold text-white hover:opacity-90">
                {t.track.share}
              </a>
              <button type="button" onClick={copy} className="min-h-[48px] rounded-full border-[1.5px] border-brand px-5 font-semibold text-brand hover:bg-brand-light">
                <span aria-live="polite">{copied ? t.track.copied : t.track.copy}</span>
              </button>
            </div>
          </>
        )}
        {waiting && (
          <div className="flex flex-wrap items-center justify-center gap-x-4">
            {data.doctorClinicId && (
              <button type="button" onClick={() => setChanging(true)} className="min-h-[44px] px-4 font-semibold text-brand underline underline-offset-4">
                {t.track.changeDay}
              </button>
            )}
            <button type="button" onClick={() => dialog.current?.showModal()} className="min-h-[44px] px-4 font-semibold text-danger underline underline-offset-4">
              {t.track.cancel}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <PatientHeader />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-10 pt-4 sm:pt-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[24px] font-bold text-ink">{t.track.title}</h1>
          <Link href="/tokens" className="min-h-[44px] content-center font-semibold text-brand underline underline-offset-4">{t.tokens.title}</Link>
        </div>
        {content}
      </main>
      <dialog ref={dialog} aria-labelledby="cancel-title"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto w-[calc(100%-24px)] max-w-sm rounded-[22px] border border-line p-6 text-ink shadow-soft backdrop:bg-ink/50">
        <h2 id="cancel-title" className="text-lg font-bold">{t.track.cancelConfirm}</h2>
        <div className="mt-5 flex flex-col gap-2.5">
          <button type="button" onClick={cancel} disabled={cancelling} className="min-h-[48px] rounded-full bg-danger px-5 font-semibold text-white disabled:opacity-60">{t.track.cancelYes}</button>
          <button type="button" onClick={() => dialog.current?.close()} className="min-h-[48px] rounded-full border-[1.5px] border-line px-5 font-semibold">{t.track.keep}</button>
        </div>
      </dialog>
      {changing && data?.doctorClinicId && (
        <ChangeDayDialog bookingId={bookingId} code={code} tracking={data} onClose={() => setChanging(false)} />
      )}
    </>
  );
}

/** Pick another day; the token moves there (new number) and this one is cancelled. */
function ChangeDayDialog({ bookingId, code, tracking, onClose }: { bookingId: string; code: string; tracking: Tracking; onClose: () => void }) {
  const { t, lang } = useLang();
  const { me } = useAccount();
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [days, setDays] = useState<BookingDay[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [hour, setHour] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    ref.current?.showModal();
    getAvailability(tracking.doctorClinicId!).then(
      (a) => setDays(a.days.filter((d) => d.date !== tracking.date)),
      (e) => setError(e instanceof ApiError ? e.message : t.common.loadError),
    );
  }, [tracking.doctorClinicId, tracking.date, t.common.loadError]);

  const today = todayIST();
  const locale = lang === "hi" ? "hi-IN" : "en-IN";
  const dayName = (d: string) =>
    d === today ? t.book.today : d === addDays(today, 1) ? t.book.tomorrow
      : new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));
  const dayNum = (d: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));
  const dayState = (d: BookingDay) =>
    d.bookable ? (d.left != null ? t.book.left(d.left) : d.start && d.end ? t.book.hours(shortTime(d.start), shortTime(d.end)) : "")
      : d.reason === "FULL" ? t.book.full : d.reason === "HOURS_OVER" ? t.book.over : t.book.off;

  async function move() {
    if (!picked) return;
    setBusy(true);
    setError("");
    try {
      const r = await rescheduleBooking(bookingId, code, picked, hours.length ? hour ?? undefined : undefined);
      // Signed in: the account lists the new token. Otherwise swap it on this phone.
      if (!me) {
        forgetToken(bookingId);
        saveToken({ bookingId: r.bookingId, code: r.trackingCode, token: r.token, date: r.date, doctorName: tracking.doctorName, clinicName: tracking.clinicName, patientName: "" });
      }
      router.replace(trackingPath(r.bookingId, r.trackingCode));
      close();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t.common.loadError);
      setBusy(false);
    }
  }

  const close = () => {
    ref.current?.close();
    onClose();
  };
  const open = days?.filter((d) => d.bookable) ?? [];
  const hours = days?.find((d) => d.date === picked)?.hours ?? [];
  const ready = !!picked && (!hours.length || hours.some((h) => h.start === hour && h.bookable));
  return (
    <dialog ref={ref} aria-labelledby="change-title" onCancel={onClose}
      onClick={(e) => e.target === ref.current && close()}
      className="m-auto w-[calc(100%-24px)] max-w-md rounded-[22px] border border-line p-6 text-ink shadow-soft backdrop:bg-ink/50">
      <h2 id="change-title" className="text-lg font-bold">{t.track.changeTitle}</h2>
      <p className="mt-1 text-[15px] text-muted">{t.track.changeIntro}</p>
      {!days && !error && <div className="mt-4 h-[84px] animate-pulse rounded-2xl bg-brand-tint motion-reduce:animate-none" />}
      {days && open.length === 0 && <p className="mt-4 rounded-xl bg-brand-tint px-4 py-3 text-[15px]">{t.track.noOtherDays}</p>}
      {days && open.length > 0 && (
        <div role="radiogroup" aria-labelledby="change-title" className="no-scrollbar -mx-6 mt-4 flex gap-2 overflow-x-auto px-6 pb-1">
          {days.map((d) => (
            <button key={d.date} type="button" role="radio" aria-checked={picked === d.date} disabled={!d.bookable || busy}
              onClick={() => { setPicked(d.date); setHour(null); }}
              className={`flex w-[92px] shrink-0 flex-col items-center rounded-2xl border-[1.5px] px-2 py-2.5 text-center disabled:opacity-45 ${picked === d.date ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
              <span className="text-[15px] font-bold">{dayName(d.date)}</span>
              <span className="text-sm">{dayNum(d.date)}</span>
              <span className={`mt-0.5 text-xs font-semibold ${picked === d.date ? "text-white" : "text-muted"}`}>{dayState(d)}</span>
            </button>
          ))}
        </div>
      )}
      {hours.length > 0 && (
        <div className="mt-4">
          <p id="change-time" className="font-bold">{t.book.chooseTime}</p>
          <div role="radiogroup" aria-labelledby="change-time" className="mt-2 grid grid-cols-2 gap-2">
            {hours.filter((h) => !h.over).map((h) => (
              <button key={h.start} type="button" role="radio" aria-checked={hour === h.start} disabled={!h.bookable || busy} onClick={() => setHour(h.start)}
                className={`flex flex-col items-center rounded-2xl border-[1.5px] px-2 py-2 text-center disabled:opacity-45 ${hour === h.start ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
                <span className="text-[15px] font-bold">{shortTime(h.start)} – {shortTime(h.end)}</span>
                <span className={`text-xs font-semibold ${hour === h.start ? "text-white" : "text-muted"}`}>{h.over ? t.book.timeOver : h.left > 0 ? t.book.left(h.left) : t.book.full}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-xl bg-danger-light px-4 py-3 font-medium text-danger">{error}</p>}
      <div className="mt-5 flex flex-col gap-2.5">
        <button type="button" onClick={move} disabled={!ready || busy} className="min-h-[48px] rounded-full bg-brand px-5 font-semibold text-white disabled:opacity-50">
          {busy ? t.track.changing : picked ? t.track.changeTo(`${dayName(picked)}, ${dayNum(picked)}`) : t.track.changeDay}
        </button>
        <button type="button" onClick={close} className="min-h-[48px] rounded-full border-[1.5px] border-line px-5 font-semibold">{t.track.keep}</button>
      </div>
    </dialog>
  );
}

function AlertButton() {
  const { t } = useLang();
  const [state, setState] = useState<"off" | "on" | "blocked">("off");
  useEffect(() => {
    if (notificationsAllowed()) setState("on");
    else if (notificationsSupported() && Notification.permission === "denied") setState("blocked");
  }, []);
  if (state === "on") return <p className="text-center text-[15px] font-semibold text-brand-dark">🔔 {t.track.alertsOn}</p>;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button type="button" onClick={async () => setState((await askForNotifications()) ? "on" : notificationsSupported() ? "blocked" : "off")}
        className="inline-flex min-h-[48px] items-center gap-2 rounded-full border-[1.5px] border-brand bg-white px-5 font-semibold text-brand hover:bg-brand-light">
        🔔 {t.track.alertMe}
      </button>
      <p className="max-w-[420px] text-center text-sm text-muted">{state === "blocked" ? t.track.alertsBlocked : t.track.alertHint}</p>
    </div>
  );
}
