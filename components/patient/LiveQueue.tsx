"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import { useLiveSlot } from "@/lib/liveSlots";
import type { DoctorCard } from "@/lib/patientApi";

/** Today's queue for one doctor, live: "Now seeing token 7 · 5 waiting", "Doctor on a break"…
 *  Nothing before OPD starts (the card already says when it opens). */
export default function LiveQueue({ doctor, className = "" }: { doctor: DoctorCard; className?: string }) {
  const { t } = useLang();
  const live = useLiveSlot(doctor.doctorClinicId, {
    sessionStatus: doctor.sessionStatus ?? null,
    withDoctor: doctor.withDoctor ?? null,
    waiting: doctor.waitingToday ?? null,
  });
  let text: string | null = null;
  let tone = "bg-brand-light text-brand-dark";
  let dot = true;
  if (live.sessionStatus === "IN_OPD") text = live.withDoctor != null ? t.live.seeing(live.withDoctor) : t.live.running;
  else if (live.sessionStatus === "ON_BREAK") (text = t.live.onBreak), (tone = "bg-[#FFF4DE] text-[#7A4B00]"), (dot = false);
  else if (live.sessionStatus === "CLOSED") (text = t.live.closed), (tone = "bg-brand-tint text-muted"), (dot = false);
  if (!text) return null;
  const running = live.sessionStatus === "IN_OPD" || live.sessionStatus === "ON_BREAK";
  return (
    <p aria-live="polite" className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${tone} ${className}`}>
      {dot && <span className="h-2 w-2 rounded-full bg-brand motion-safe:animate-pulse" aria-hidden="true" />}
      {text}
      {running && live.waiting != null && live.waiting > 0 && <span className="font-normal opacity-80">· {t.live.waiting(live.waiting)}</span>}
    </p>
  );
}
