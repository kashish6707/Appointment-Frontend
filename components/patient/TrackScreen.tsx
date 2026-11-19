"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { loadTokens, saveToken } from "@/lib/myTokens";
import { cancelBooking, getTracking, type Tracking } from "@/lib/patientApi";
import { clockTime, longDate, shortTime, todayIST } from "@/lib/time";
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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { me } = useAccount();
  const signedOut = useRef(false);
  signedOut.current = me === null;

  const load = useCallback(async () => {
    if (!code) return setError(t.track.notFound);
    try {
      const r = await getTracking(bookingId, code);
      setData(r);
      setError("");
      setUpdatedAt(new Date());
      // Not signed in: keep it in "My tokens" on this device, e.g. when opened from a shared link.
      if (signedOut.current && !loadTokens().some((x) => x.bookingId === bookingId)) {
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
    // One line in plain words about where things stand.
    let headline: string;
    let tone: "brand" | "amber" | "muted" | "danger" = "brand";
    if (data.status === "WITH_DOCTOR") headline = t.track.withDoctor;
    else if (data.status === "DONE") (headline = t.track.done), (tone = "muted");
    else if (data.status === "SENT_FOR_TESTS") (headline = t.track.sentForTests), (tone = "amber");
    else if (data.status === "NO_SHOW") (headline = t.track.noShow), (tone = "danger");
    else if (data.status === "CANCELLED") (headline = t.track.cancelled), (tone = "muted");
    else if (data.status === "PENDING_PAYMENT" || data.status === "PAYMENT_FAILED") (headline = t.track.pending), (tone = "amber");
    else if (data.sessionStatus === "CLOSED") (headline = t.track.closed), (tone = "muted");
    else if (!isToday) (headline = t.track.future(longDate(data.date))), (tone = "muted");
    else if (data.sessionStatus === "ON_BREAK") (headline = t.track.onBreak(data.breakUntil ? clockTime(data.breakUntil) : null)), (tone = "amber");
    else if (data.sessionStatus === "NOT_STARTED") (headline = t.track.notStarted(shortTime(data.opdStart))), (tone = "amber");
    else headline = t.track.ahead(data.patientsAhead ?? 0);

    const toneClass = { brand: "bg-brand-light text-brand-dark", amber: "bg-[#FFF4DE] text-[#7A4B00]", muted: "bg-brand-tint text-muted", danger: "bg-danger-light text-danger" }[tone];
    const showQueue = isToday && waiting && data.sessionStatus !== "CLOSED";
    const shareText = t.track.shareText(data.token ?? "–", data.doctorName, link);

    content = (
      <div className="flex flex-col gap-4">
        <section className="overflow-hidden rounded-[22px] border border-line bg-white shadow-soft">
          <div className="border-b border-dashed border-line px-5 py-4">
            <p className="text-lg font-bold text-ink">{data.doctorName}</p>
            <p className="text-[15px] text-muted">{data.clinicName}</p>
            <p className="mt-1 text-[15px] font-semibold text-ink">{longDate(data.date)}</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-dashed divide-line text-center">
            <div className="px-3 py-5">
              <p className="text-[15px] font-semibold text-muted">{t.track.tokenLabel}</p>
              <p className="mt-1 text-[56px] font-extrabold leading-none text-brand-dark sm:text-[64px]">{data.token ?? "–"}</p>
            </div>
            <div className="px-3 py-5">
              <p className="text-[15px] font-semibold text-muted">{t.track.nowServing}</p>
              <p aria-live="polite" className="mt-1 text-[56px] font-extrabold leading-none text-ink sm:text-[64px]">
                {isToday && data.nowServing != null ? data.nowServing : "–"}
              </p>
            </div>
          </div>
          <div className={`px-5 py-4 ${toneClass}`} aria-live="polite">
            <p className="text-[18px] font-bold leading-snug">{headline}</p>
            {showQueue && data.sessionStatus !== "NOT_STARTED" && data.estimatedMinutes != null && data.estimatedMinutes >= 5 && (
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] font-semibold">
                <span className="inline-flex items-center gap-1.5"><ClockIcon size={18} /> {t.track.wait(data.estimatedMinutes)}</span>
                {data.expectedAt && <span>{t.track.expected(shortTime(data.expectedAt))}</span>}
              </p>
            )}
          </div>
        </section>

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
          <button type="button" onClick={() => dialog.current?.showModal()} className="mx-auto min-h-[44px] px-4 font-semibold text-danger underline underline-offset-4">
            {t.track.cancel}
          </button>
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
    </>
  );
}
