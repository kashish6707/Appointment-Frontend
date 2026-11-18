"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { forgetToken, useSavedTokens } from "@/lib/myTokens";
import { trackingPath } from "@/lib/patientApi";
import { longDate, todayIST } from "@/lib/time";
import PatientHeader from "./PatientHeader";

/** Tokens booked or opened on this device (no patient account yet). */
export default function TokensScreen() {
  const { t } = useLang();
  const tokens = useSavedTokens();
  const today = todayIST();
  // Today's and upcoming first, then past ones.
  const sorted = tokens && [...tokens].sort((a, b) => {
    const pa = a.date < today ? 1 : 0;
    const pb = b.date < today ? 1 : 0;
    return pa - pb || (pa ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  });

  return (
    <>
      <PatientHeader />
      <main className="mx-auto flex max-w-[640px] flex-col gap-4 px-4 pb-10 pt-4 sm:pt-8">
        <h1 className="text-[24px] font-bold text-ink">{t.tokens.title}</h1>
        {sorted === null ? null : sorted.length === 0 ? (
          <div className="rounded-[22px] bg-brand-tint px-5 py-10 text-center">
            <p className="text-[16px] text-muted">{t.tokens.empty}</p>
            <Link href="/" className="mt-4 inline-flex min-h-[48px] items-center rounded-full bg-brand px-6 font-semibold text-white hover:bg-brand-dark">{t.tokens.find}</Link>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {sorted.map((x) => (
                <li key={x.bookingId} className={`flex items-center gap-4 rounded-[22px] border border-line bg-white p-4 shadow-soft ${x.date < today ? "opacity-70" : ""}`}>
                  <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-light text-brand-dark">
                    <span className="text-[26px] font-extrabold leading-none">{x.token ?? "–"}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink">{x.doctorName}</p>
                    <p className="truncate text-[15px] text-muted">{x.clinicName}</p>
                    <p className="text-[15px] font-semibold text-ink">{x.date === today ? t.book.today : longDate(x.date)}{x.patientName ? ` · ${x.patientName}` : ""}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Link href={trackingPath(x.bookingId, x.code)} className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-5 font-semibold text-white hover:bg-brand-dark">{t.tokens.open}</Link>
                    <button type="button" onClick={() => forgetToken(x.bookingId)} className="min-h-[36px] px-2 text-sm font-semibold text-muted underline underline-offset-4">{t.tokens.remove}</button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-center text-sm text-muted">{t.tokens.onDevice}</p>
          </>
        )}
      </main>
    </>
  );
}
