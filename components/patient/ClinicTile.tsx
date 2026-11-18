"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ClinicCard, OpdStatus } from "@/lib/patientApi";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { shortTime } from "@/lib/time";
import { ChevronLeft, ChevronRight } from "./icons";
import { Avatar, ClinicArt } from "./Pictures";

export function OpdStatusText({ status, opensAt, className = "" }: { status: OpdStatus; opensAt: string | null; className?: string }) {
  const { t } = useLang();
  if (status === "OPEN_NOW") {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold text-brand-dark ${className}`}>
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand" />
        {t.tile.openNow}
      </span>
    );
  }
  if (status === "OPENS_LATER" && opensAt) {
    return <span className={`font-semibold text-[#7A4B00] ${className}`}>{t.tile.opensAt(shortTime(opensAt))}</span>;
  }
  return <span className={`font-semibold text-muted ${className}`}>{t.tile.closedToday}</span>;
}

export default function ClinicTile({ clinic }: { clinic: ClinicCard }) {
  const { t, lang } = useLang();
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const slideCount = 1 + clinic.doctors.length;
  const name = lang === "hi" && clinic.nameHi ? clinic.nameHi : clinic.name;

  // Which slide is showing: watched with IntersectionObserver, so swiping and arrows both update it.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [slideCount]);

  function goTo(i: number) {
    const root = scroller.current;
    if (!root) return;
    const index = Math.max(0, Math.min(slideCount - 1, i));
    root.scrollTo({ left: index * root.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return (
    <article className="group flex w-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-line bg-white shadow-soft">
      <div className="relative" role="region" aria-roledescription="carousel" aria-label={t.tile.slides(name)}>
        <div
          ref={scroller}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); goTo(active + 1); }
            if (e.key === "ArrowLeft") { e.preventDefault(); goTo(active - 1); }
          }}
        >
          {/* Slide 1: the clinic */}
          <div data-index={0} className="relative h-[230px] w-full shrink-0 snap-start" role="group" aria-roledescription="slide" aria-label={t.tile.slideOf(1, slideCount)}>
            {clinic.coverPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clinic.coverPhotoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <ClinicArt colour={clinic.coverColour} type={clinic.type} />
            )}
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-brand-dark shadow-soft">
              {clinic.type === "HOSPITAL" ? t.tile.hospital : t.tile.clinic}
            </span>
            {clinic.doctors.length > 0 && (
              <span className="absolute right-3 top-3 rounded-full bg-ink/75 px-3 py-1 text-sm font-medium text-white">{t.tile.swipeHint}</span>
            )}
          </div>

          {/* Slides 2+: one doctor each */}
          {clinic.doctors.map((d, i) => (
            <div
              key={d.doctorClinicId}
              data-index={i + 1}
              role="group"
              aria-roledescription="slide"
              aria-label={t.tile.slideOf(i + 2, slideCount)}
              className="flex h-[230px] w-full shrink-0 snap-start flex-col items-center justify-center gap-1.5 bg-brand-tint px-5 text-center"
            >
              <Avatar name={d.name} initials={d.initials} photoUrl={d.photoUrl} size={68} />
              {d.registrationNo && (
                <span className="rounded-full border border-line bg-white px-2.5 py-0.5 text-xs font-semibold text-muted">{t.tile.regNo(d.registrationNo)}</span>
              )}
              <p className="text-lg font-bold leading-tight text-ink">{lang === "hi" && d.nameHi ? d.nameHi : d.name}</p>
              <p className="text-[15px] font-semibold leading-snug text-brand-dark">{d.designation || d.department}</p>
              {d.degree && <p className="line-clamp-1 text-sm text-muted">{d.degree}</p>}
              <p className="text-[15px] font-bold text-ink">{t.tile.fee(d.fee)}</p>
            </div>
          ))}
        </div>

        {slideCount > 1 && (
          <>
            <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label={t.tile.previous}
              className="absolute left-2 top-[115px] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-soft transition-opacity disabled:invisible group-hover:opacity-100 focus-visible:opacity-100 md:flex md:opacity-0">
              <ChevronLeft />
            </button>
            <button type="button" onClick={() => goTo(active + 1)} disabled={active === slideCount - 1} aria-label={t.tile.next}
              className="absolute right-2 top-[115px] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-soft transition-opacity disabled:invisible group-hover:opacity-100 focus-visible:opacity-100 md:flex md:opacity-0">
              <ChevronRight />
            </button>
          </>
        )}
      </div>

      {slideCount > 1 && (
        <div className="flex justify-center gap-1.5 pt-3">
          {Array.from({ length: slideCount }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={t.tile.goTo(i + 1)}
              aria-current={active === i ? "true" : undefined}
              className="flex h-6 items-center px-0.5"
            >
              <span className={`block h-2 rounded-full transition-all ${active === i ? "w-6 bg-brand" : "w-2 bg-line"}`} />
            </button>
          ))}
        </div>
      )}

      {/* The details open the clinic page; the slides above only swipe. */}
      <Link href={`/clinics/${clinic.id}`} aria-label={t.tile.open(name)} className="block flex-1 rounded-b-[22px] px-5 pb-5 pt-3 hover:bg-brand-tint/60">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-snug text-ink">{name}</h3>
          {clinic.distanceKm != null && <span className="shrink-0 pt-0.5 text-sm font-semibold text-muted">{t.tile.km(clinic.distanceKm)}</span>}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[15px] text-muted">{clinic.address}</p>
        <div className="my-3 border-t border-dashed border-line" />
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[15px]">
          <span className="text-ink">{clinic.summary}</span>
          <OpdStatusText status={clinic.opdStatus} opensAt={clinic.opensAt} />
        </div>
      </Link>
    </article>
  );
}
