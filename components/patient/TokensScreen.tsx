"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { forgetToken, saveToken, useSavedTokens } from "@/lib/myTokens";
import { bookingLink, myBookings, type AccountBooking } from "@/lib/patientAccount";
import { trackingPath } from "@/lib/patientApi";
import { longDate, todayIST } from "@/lib/time";
import { useAccount } from "./AccountProvider";
import PatientHeader from "./PatientHeader";

type Row = {
  bookingId: string;
  token: number | null;
  date: string;
  doctorName: string;
  clinicName: string;
  patientName: string;
  status?: string;
  code?: string; // saved on this device
  fromAccount: boolean;
};

const ACTIVE = new Set(["WAITING", "WITH_DOCTOR", "PENDING_PAYMENT"]);

/** Tokens in the patient's account (any device) plus ones booked or opened on this phone. */
export default function TokensScreen() {
  const { t } = useLang();
  const router = useRouter();
  const { me } = useAccount();
  const device = useSavedTokens();
  const [account, setAccount] = useState<AccountBooking[] | null>(null);
  const [opening, setOpening] = useState("");
  const [error, setError] = useState("");
  const today = todayIST();

  useEffect(() => {
    if (!me) return setAccount(me === null ? [] : null);
    myBookings().then((r) => setAccount(r.bookings), () => setAccount([]));
  }, [me]);

  const rows: Row[] | null = device === null || account === null ? null : (() => {
    const byId = new Map<string, Row>();
    for (const b of account) byId.set(b.bookingId, { ...b, fromAccount: true });
    for (const x of device) {
      const found = byId.get(x.bookingId);
      if (found) found.code = x.code;
      else byId.set(x.bookingId, { ...x, fromAccount: false });
    }
    // Today's and upcoming first (soonest first), then past ones (latest first).
    return [...byId.values()].sort((a, b) => {
      const pa = a.date < today ? 1 : 0;
      const pb = b.date < today ? 1 : 0;
      return pa - pb || (pa ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)) || (a.token ?? 0) - (b.token ?? 0);
    });
  })();

  async function open(r: Row) {
    if (r.code) return router.push(trackingPath(r.bookingId, r.code));
    // Booked from another device: get a tracking code for this one.
    setOpening(r.bookingId);
    setError("");
    try {
      const { code } = await bookingLink(r.bookingId);
      saveToken({ bookingId: r.bookingId, code, token: r.token, date: r.date, doctorName: r.doctorName, clinicName: r.clinicName, patientName: r.patientName });
      router.push(trackingPath(r.bookingId, code));
    } catch {
      setError(t.common.loadError);
      setOpening("");
    }
  }

  return (
    <>
      <PatientHeader />
      <main className="mx-auto flex max-w-[640px] flex-col gap-4 px-4 pb-10 pt-4 sm:pt-8">
        <h1 className="text-[24px] font-bold text-ink">{t.tokens.title}</h1>
        {error && <p role="alert" className="rounded-xl bg-danger-light px-4 py-3 font-medium text-danger">{error}</p>}
        {rows === null ? (
          <div className="h-40 animate-pulse rounded-[22px] bg-brand-tint motion-reduce:animate-none" />
        ) : rows.length === 0 ? (
          <div className="rounded-[22px] bg-brand-tint px-5 py-10 text-center">
            <p className="text-[16px] text-muted">{me ? t.tokens.emptyAccount : t.tokens.empty}</p>
            <Link href="/" className="mt-4 inline-flex min-h-[48px] items-center rounded-full bg-brand px-6 font-semibold text-white hover:bg-brand-dark">{t.tokens.find}</Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((x) => {
              const past = x.date < today || (x.status != null && !ACTIVE.has(x.status));
              return (
                <li key={x.bookingId} className={`flex items-center gap-4 rounded-[22px] border border-line bg-white p-4 shadow-soft ${past ? "opacity-70" : ""}`}>
                  <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-light text-brand-dark">
                    <span className="text-[26px] font-extrabold leading-none">{x.token ?? "–"}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink">{x.doctorName}</p>
                    <p className="truncate text-[15px] text-muted">{x.clinicName}</p>
                    <p className="text-[15px] font-semibold text-ink">
                      {x.date === today ? t.book.today : longDate(x.date)}{x.patientName ? ` · ${x.patientName}` : ""}
                    </p>
                    {x.status && t.tokens.status[x.status] && <p className="text-sm text-muted">{t.tokens.status[x.status]}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <button type="button" onClick={() => open(x)} disabled={opening === x.bookingId}
                      className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                      {t.tokens.open}
                    </button>
                    {!x.fromAccount && (
                      <button type="button" onClick={() => forgetToken(x.bookingId)} className="min-h-[36px] px-2 text-sm font-semibold text-muted underline underline-offset-4">{t.tokens.remove}</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {rows && rows.length > 0 && <p className="text-center text-sm text-muted">{me ? t.tokens.inAccount : t.tokens.onDevice}</p>}
        {me === null && (
          <p className="text-center text-[15px] text-muted">
            {t.tokens.signInHint} <Link href="/login?next=/tokens" className="font-semibold text-brand underline underline-offset-4">{t.auth.signIn}</Link>
          </p>
        )}
      </main>
    </>
  );
}
