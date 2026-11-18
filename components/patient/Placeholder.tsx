"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { PatientStrings } from "@/lib/i18n/patient";
import PatientHeader from "./PatientHeader";

type Which = "tokens" | "records" | "profile" | "booking";

/** Pages that come next: a short note and a way home. */
export default function Placeholder({ which }: { which: Which }) {
  const { t } = useLang();
  const titles: Record<Which, (t: PatientStrings) => string> = {
    tokens: (t) => t.header.myTokens,
    records: (t) => t.header.myRecords,
    profile: (t) => t.header.myProfile,
    booking: (t) => t.placeholder.booking,
  };
  const text = which === "booking" ? t.placeholder.bookingText : t.placeholder[which];
  return (
    <>
      <PatientHeader />
      <main className="mx-auto flex max-w-[640px] flex-col items-center gap-4 px-4 py-14 text-center">
        <span className="rounded-full bg-brand-light px-3 py-1 text-sm font-semibold text-brand-dark">{t.common.comingSoon}</span>
        <h1 className="text-[26px] font-bold text-ink">{titles[which](t)}</h1>
        <p className="text-[16px] text-muted">{text}</p>
        <Link href="/" className="mt-2 inline-flex min-h-[48px] items-center rounded-full bg-brand px-6 font-semibold text-white hover:bg-brand-dark">{t.placeholder.home}</Link>
      </main>
    </>
  );
}
