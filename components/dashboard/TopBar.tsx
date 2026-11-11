"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import Logo from "@/components/Logo";
import { keys, type DoctorProfile, type Me, type SearchResult } from "@/lib/doctorApi";
import { t } from "@/lib/strings";
import { shortDate } from "@/lib/time";
import LogoutButton from "@/app/doctor/dashboard/LogoutButton";
import { initials, StatusChip } from "./ui";

type Props = {
  me: Me;
  doctor: DoctorProfile;
  clinicId: string | undefined;
  onClinicChange: (doctorClinicId: string) => void;
  date: string;
  onOpenBooking: (bookingId: string) => void;
};

export default function TopBar({ me, doctor, clinicId, onClinicChange, date, onOpenBooking }: Props) {
  const clinic = doctor.clinics.find((c) => c.doctorClinicId === clinicId) ?? doctor.clinics[0];
  const isStaff = me.viewer.type === "STAFF";
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Logo size={36} />
        <div className="order-3 w-full md:order-none md:w-auto md:flex-1">
          <PatientSearch date={date} clinicId={clinicId} onOpen={onOpenBooking} />
        </div>
        <div className="ml-auto flex items-center gap-3">
          {doctor.clinics.length > 1 ? (
            <label className="hidden sm:block">
              <span className="sr-only">{t.topBar.clinicLabel}</span>
              <select
                value={clinic?.doctorClinicId}
                onChange={(e) => onClinicChange(e.target.value)}
                className="max-w-[220px] rounded-full border-[1.5px] border-line bg-white px-3 py-2 text-sm font-semibold text-ink focus:border-brand"
              >
                {doctor.clinics.map((c) => (
                  <option key={c.doctorClinicId} value={c.doctorClinicId}>
                    {c.name}, {c.area}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {me.viewer.permissions.includes("schedule.manage") && (
            <Link href="/doctor/schedule" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light sm:inline-flex">
              {t.access.timingsLink}
            </Link>
          )}
          {!isStaff && (
            <Link href="/doctor/profile" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light sm:inline-flex">
              {t.profile.link}
            </Link>
          )}
          {!isStaff && (
            <Link href="/doctor/staff" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light sm:inline-flex">
              {t.access.staffLink}
            </Link>
          )}
          <div className="hidden text-right leading-tight lg:block">
            <p className="font-semibold text-ink">
              {me.viewer.fullName}
              {isStaff && me.viewer.role && <span className="font-normal text-muted"> · {t.roles[me.viewer.role]}</span>}
            </p>
            <p className="text-sm text-muted">
              {isStaff ? t.access.workingFor(doctor.fullName) : clinic?.name}
              {isStaff && me.workplaces.length > 1 && (
                <>
                  {" · "}
                  <Link href="/doctor/dashboard?switch" className="font-semibold text-brand underline underline-offset-2">{t.access.switchDoctor}</Link>
                </>
              )}
            </p>
          </div>
          {!isStaff && doctor.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doctor.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-light" />
          ) : (
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light font-bold uppercase text-brand-dark">
              {initials(me.viewer.fullName)}
            </span>
          )}
          <LogoutButton />
        </div>
        {doctor.clinics.length > 1 && (
          <label className="order-4 w-full sm:hidden">
            <span className="sr-only">{t.topBar.clinicLabel}</span>
            <select
              value={clinic?.doctorClinicId}
              onChange={(e) => onClinicChange(e.target.value)}
              className="w-full rounded-full border-[1.5px] border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
            >
              {doctor.clinics.map((c) => (
                <option key={c.doctorClinicId} value={c.doctorClinicId}>
                  {c.name}, {c.area}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </header>
  );
}

function PatientSearch({ date, clinicId, onOpen }: { date: string; clinicId?: string; onOpen: (id: string) => void }) {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);

  // Wait for a pause in typing before searching.
  useEffect(() => {
    const id = setTimeout(() => setQ(text.trim()), 250);
    return () => clearTimeout(id);
  }, [text]);

  const { data, isLoading, error } = useSWR<{ results: SearchResult[] }>(q ? keys.search(q, date, clinicId) : null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const show = open && q.length > 0;
  return (
    <div ref={box} className="relative" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <label htmlFor="patient-search" className="sr-only">{t.topBar.searchLabel}</label>
      <div className="flex items-center gap-2 rounded-full border-[1.5px] border-transparent bg-brand-tint px-4 focus-within:border-brand">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          id="patient-search"
          type="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={show}
          aria-controls={listId}
          placeholder={t.topBar.searchPlaceholder}
          value={text}
          onChange={(e) => { setText(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-ink placeholder:text-muted focus:outline-none"
        />
      </div>
      {show && (
        <div id={listId} className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[60vh] overflow-auto rounded-[20px] border border-line bg-white p-2 shadow-soft">
          {isLoading && <p className="px-3 py-2 text-muted">{t.topBar.searching}</p>}
          {error && <p className="px-3 py-2 text-danger">{error.message}</p>}
          {data && data.results.length === 0 && <p className="px-3 py-2 text-muted">{t.topBar.noResults(q)}</p>}
          {data && data.results.length > 0 && (
            <ul>
              {data.results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => { onOpen(r.id); setOpen(false); }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-brand-tint"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">{r.patient.name}</span>
                      <span className="block text-sm text-muted">
                        {t.topBar.tokenOn(r.token, shortDate(r.date))} · {r.clinicName}
                      </span>
                    </span>
                    <StatusChip status={r.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
