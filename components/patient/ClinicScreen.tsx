"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getClinic, getClinicDoctors, type ClinicDetails, type DoctorCard } from "@/lib/patientApi";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { shortTime } from "@/lib/time";
import { OpdStatusText } from "./ClinicTile";
import { ChevronLeft, ClockIcon, DirectionsIcon, PhoneIcon } from "./icons";
import { Avatar, ClinicArt } from "./Pictures";

export default function ClinicScreen({ id }: { id: string }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [clinic, setClinic] = useState<ClinicDetails | null | undefined>(undefined);
  const [doctors, setDoctors] = useState<DoctorCard[] | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let stale = false;
    setError(false);
    getClinic(id).then((c) => !stale && setClinic(c), () => !stale && setError(true));
    return () => {
      stale = true;
    };
  }, [id, reload]);

  useEffect(() => {
    let stale = false;
    setDoctors(null);
    getClinicDoctors(id, department ?? undefined).then((d) => !stale && setDoctors(d), () => !stale && setError(true));
    return () => {
      stale = true;
    };
  }, [id, department, reload]);

  function back() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  const backButton = (
    <button type="button" onClick={back} aria-label={t.common.back}
      className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-soft hover:bg-brand-tint">
      <ChevronLeft />
    </button>
  );

  if (error) {
    return (
      <main className="mx-auto max-w-[900px] px-4 py-10">
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border-[1.5px] border-danger bg-danger-light px-4 py-3">
          <p className="font-medium text-danger">{t.common.loadError}</p>
          <button type="button" onClick={() => setReload((n) => n + 1)} className="min-h-[44px] rounded-full border-[1.5px] border-danger bg-white px-4 font-semibold text-danger">{t.common.retry}</button>
        </div>
      </main>
    );
  }
  if (clinic === null) {
    return (
      <main className="mx-auto max-w-[900px] px-4 py-10 text-center">
        <p className="text-[16px] text-muted">{t.clinic.notFound}</p>
        <Link href="/" className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-brand px-6 font-semibold text-white">{t.placeholder.home}</Link>
      </main>
    );
  }
  if (clinic === undefined) {
    return (
      <main className="mx-auto max-w-[900px]">
        <div className="h-[210px] animate-pulse bg-brand-tint motion-reduce:animate-none" />
        <div className="space-y-3 px-4 py-5"><div className="h-7 w-2/3 rounded bg-brand-tint" /><div className="h-5 w-1/2 rounded bg-brand-tint" /></div>
      </main>
    );
  }

  const name = lang === "hi" && clinic.nameHi ? clinic.nameHi : clinic.name;
  const hours = lang === "hi" ? clinic.opdHoursTextHi ?? clinic.opdHoursTextEn : clinic.opdHoursTextEn;
  const mapQuery = clinic.lat != null && clinic.lng != null && !clinic.locationIsApproximate ? `${clinic.lat},${clinic.lng}` : `${clinic.name}, ${clinic.address}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const deptName = (key: string, en: string, hi: string) => t.departments.names[key] ?? (lang === "hi" ? hi : en);

  return (
    <main className="mx-auto max-w-[900px] pb-6 md:px-6 md:pt-6">
      <div className="relative h-[210px] overflow-hidden md:rounded-[22px]">
        {clinic.coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clinic.coverPhoto.large} alt="" className="h-full w-full object-cover" />
        ) : (
          <ClinicArt colour={clinic.coverColour} type={clinic.type} />
        )}
        {backButton}
      </div>

      <div className="px-4 pt-4 md:px-0">
        <span className="inline-block rounded-full bg-brand-light px-3 py-1 text-sm font-semibold text-brand-dark">
          {clinic.type === "HOSPITAL" ? t.tile.hospital : t.tile.clinic}
        </span>
        <h1 className="mt-2 text-[26px] font-bold leading-tight text-ink sm:text-[30px]">{name}</h1>
        <p className="mt-1 text-[16px] text-muted">{clinic.address}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]">
          <OpdStatusText status={clinic.opdStatus} opensAt={clinic.opensAt} />
          {clinic.locationIsApproximate && <span className="text-muted">{t.clinic.approx}</span>}
        </div>
        {hours && (
          <p className="mt-2 flex items-center gap-2 text-[16px] font-semibold text-brand-dark">
            <ClockIcon size={20} /> <span className="sr-only">{t.clinic.hours}: </span>{hours}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2.5">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full border-[1.5px] border-brand px-5 font-semibold text-brand hover:bg-brand-light">
            <DirectionsIcon size={20} /> {t.clinic.directions}
          </a>
          {clinic.phone && (
            <a href={`tel:+91${clinic.phone}`} className="inline-flex min-h-[48px] items-center gap-2 rounded-full border-[1.5px] border-brand px-5 font-semibold text-brand hover:bg-brand-light">
              <PhoneIcon size={20} /> {t.clinic.call}
            </a>
          )}
        </div>

        <section aria-labelledby="doctors-title" className="mt-7">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="doctors-title" className="text-xl font-bold text-ink">{t.clinic.doctorsAt(clinic.type)}</h2>
            <span className="text-[15px] text-muted">{clinic.doctorCount}</span>
          </div>
          {clinic.departments.length > 1 && (
            <div role="group" aria-label={t.departments.title} className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
              {[null, ...clinic.departments].map((d) => (
                <button key={d?.key ?? "all"} type="button" onClick={() => setDepartment(d?.key ?? null)} aria-pressed={department === (d?.key ?? null)}
                  className={`min-h-[44px] shrink-0 rounded-full border-[1.5px] px-4 text-[15px] font-semibold ${department === (d?.key ?? null) ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"}`}>
                  {d ? deptName(d.key, d.nameEn, d.nameHi) : t.clinic.all}
                </button>
              ))}
            </div>
          )}

          <ul className="mt-4 flex flex-col gap-3">
            {doctors === null
              ? Array.from({ length: 2 }, (_, i) => <li key={i} className="h-[150px] animate-pulse rounded-[22px] bg-brand-tint motion-reduce:animate-none" />)
              : doctors.length === 0
                ? <li className="rounded-[22px] bg-brand-tint px-4 py-6 text-center text-muted">{t.clinic.noDoctors}</li>
                : doctors.map((d) => <DoctorRow key={d.doctorClinicId} doctor={d} />)}
          </ul>
        </section>
      </div>
    </main>
  );
}

function DoctorRow({ doctor: d }: { doctor: DoctorCard }) {
  const { t, lang } = useLang();
  const name = lang === "hi" && d.nameHi ? d.nameHi : d.name;
  const when = d.opdStatus === "OPEN_NOW" && d.waitingToday != null
    ? <span className="font-semibold text-brand-dark">{t.clinic.waitingToday(d.waitingToday)}</span>
    : d.opensAt
      ? <span className="font-semibold text-[#7A4B00]">{t.clinic.opensAt(shortTime(d.opensAt))}</span>
      : <span className="font-semibold text-muted">{t.clinic.closedToday}</span>;
  return (
    <li className="rounded-[22px] border border-line bg-white p-4 shadow-soft sm:p-5">
      <div className="flex gap-4">
        <Avatar name={d.name} initials={d.initials} photoUrl={d.photoUrl} size={64} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-snug text-ink">{name}</p>
          <p className="text-[15px] font-semibold text-brand-dark">{d.designation || d.department}</p>
          <p className="text-[15px] text-muted">
            {[d.degree, d.experienceYears != null ? t.clinic.experience(d.experienceYears) : null].filter(Boolean).join(" · ")}
          </p>
          {d.registrationNo && <p className="mt-0.5 text-sm text-muted">{t.tile.regNo(d.registrationNo)}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-3">
        <div className="flex flex-col text-[15px]">
          <span className="text-[17px] font-bold text-ink">{t.tile.fee(d.fee)}</span>
          {when}
        </div>
        <Link href={`/book/${encodeURIComponent(d.doctorClinicId)}`} aria-label={t.clinic.bookFor(name)}
          className="inline-flex min-h-[48px] items-center rounded-full bg-brand px-6 text-[16px] font-semibold text-white hover:bg-brand-dark">
          {t.clinic.book}
        </Link>
      </div>
    </li>
  );
}
