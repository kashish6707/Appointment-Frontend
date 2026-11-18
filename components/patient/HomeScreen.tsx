"use client";

import { useEffect, useRef, useState } from "react";
import { getHome, type ClinicCard, type Department, type HomeParams } from "@/lib/patientApi";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { DEFAULT_LOCATION, useSavedLocation } from "@/lib/location";
import { sampleAreas } from "@/lib/sampleData";
import ClinicTile from "./ClinicTile";
import { useHelp } from "./HelpDialog";
import { CloseIcon, DepartmentIcon, PhoneIcon, SearchIcon, WarningIcon } from "./icons";
import PatientHeader from "./PatientHeader";

type Filter = "all" | "clinic" | "hospital" | "open";
const HELP_AFTER_MS = 60_000;

export default function HomeScreen() {
  const { t, lang } = useLang();
  const help = useHelp();
  const { location, ready } = useSavedLocation();

  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clinics, setClinics] = useState<ClinicCard[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reload, setReload] = useState(0);
  const emptySearches = useRef(0);

  // Search after a short pause in typing.
  useEffect(() => {
    const id = setTimeout(() => setQ(text.trim()), 300);
    return () => clearTimeout(id);
  }, [text]);

  // After a minute on the home page without opening a clinic, offer help (once per session).
  useEffect(() => {
    const id = setTimeout(help.openOnce, HELP_AFTER_MS);
    return () => clearTimeout(id);
  }, [help.openOnce]);

  const loc = location ?? DEFAULT_LOCATION;
  const sample = sampleAreas.find((a) => a.id === loc.areaId);
  const params: HomeParams = {
    ...(loc.backendAreaId ? { areaId: loc.backendAreaId } : loc.lat != null ? { lat: loc.lat, lng: loc.lng } : sample?.lat != null ? { lat: sample.lat, lng: sample.lng } : {}),
    type: filter === "clinic" || filter === "hospital" ? filter : "all",
    openNow: filter === "open",
    department: department ?? undefined,
    q: q || undefined,
  };
  const key = JSON.stringify(params);

  useEffect(() => {
    if (!ready) return;
    let stale = false;
    setError(false);
    getHome(params).then(
      (r) => {
        if (stale) return;
        setDepartments(r.departments);
        setClinics(r.clinics);
        setNextCursor(r.nextCursor);
        // Two searches in a row that find nothing: offer help (once per session).
        if (params.q) {
          emptySearches.current = r.clinics.length === 0 ? emptySearches.current + 1 : 0;
          if (emptySearches.current >= 2) help.openOnce();
        }
      },
      () => !stale && setError(true),
    );
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready, reload]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const r = await getHome({ ...params, cursor: nextCursor });
      setClinics((c) => [...(c ?? []), ...r.clinics]);
      setNextCursor(r.nextCursor);
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  const deptName = (d: Department) => t.departments.names[d.key] ?? (lang === "hi" ? d.nameHi : d.nameEn);
  const selected = departments.find((d) => d.key === department);

  return (
    <>
      <PatientHeader />
      <main className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 pb-6 pt-4 sm:px-6 sm:pt-6">
        {/* Search */}
        <div className="flex items-center gap-2.5 rounded-full border-[1.5px] border-line bg-white px-4 shadow-soft focus-within:border-brand">
          <span className="text-brand"><SearchIcon /></span>
          <label htmlFor="home-search" className="sr-only">{t.search.label}</label>
          <input id="home-search" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={t.search.placeholder}
            autoComplete="off" className="min-h-[52px] min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-muted focus:outline-none" />
          {text && (
            <button type="button" onClick={() => setText("")} aria-label={t.search.clear} className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-brand-tint">
              <CloseIcon size={20} />
            </button>
          )}
        </div>

        {/* Departments */}
        <section aria-labelledby="dept-title">
          <h2 id="dept-title" className="mb-3 text-xl font-bold text-ink">{t.departments.title}</h2>
          <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:gap-4">
            {(departments.length ? departments : Array.from({ length: 8 }, () => null)).map((d, i) => (
              <li key={d?.key ?? i} className="snap-start">
                {d ? (
                  <button type="button" onClick={() => setDepartment(department === d.key ? null : d.key)} aria-pressed={department === d.key}
                    className="flex w-[76px] flex-col items-center gap-1.5 rounded-2xl p-1 text-center lg:w-[96px]">
                    <span className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors lg:h-[84px] lg:w-[84px] ${department === d.key ? "bg-brand text-white" : "bg-brand-light text-brand-dark"}`}>
                      <DepartmentIcon iconKey={d.iconKey} />
                    </span>
                    <span className={`text-[14px] font-semibold leading-tight ${department === d.key ? "text-brand-dark" : "text-ink"}`}>{deptName(d)}</span>
                  </button>
                ) : (
                  <span aria-hidden="true" className="block h-[104px] w-[76px] animate-pulse rounded-2xl bg-brand-tint motion-reduce:animate-none" />
                )}
              </li>
            ))}
          </ul>
          {selected && (
            <button type="button" onClick={() => setDepartment(null)} aria-label={t.departments.clear(deptName(selected))}
              className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-full bg-brand-light px-4 font-semibold text-brand-dark">
              {t.departments.showing(deptName(selected))} <CloseIcon size={18} />
            </button>
          )}
        </section>

        {/* Emergency */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[#F2C7C0] bg-danger-light px-4 py-3">
          <p className="flex items-center gap-2.5 text-[16px] font-semibold text-[#7E2318]">
            <span className="text-danger"><WarningIcon /></span>
            {t.emergency.text}
          </p>
          <a href="tel:108" className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-danger px-5 font-bold text-white hover:opacity-90">
            <PhoneIcon size={20} /> {t.emergency.call}
          </a>
        </div>

        {/* Clinics and hospitals */}
        <section aria-labelledby="list-title" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="list-title" className="text-xl font-bold text-ink">{t.list.title}</h2>
            {clinics && <span className="text-[15px] text-muted">{t.list.count(clinics.length)}{nextCursor ? "+" : ""}</span>}
          </div>
          <div role="group" aria-label={t.list.filterLabel} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {(["all", "clinic", "hospital", "open"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}
                className={`min-h-[44px] shrink-0 rounded-full border-[1.5px] px-4 text-[15px] font-semibold transition-colors ${filter === f ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"}`}>
                {t.list.filters[f]}
              </button>
            ))}
          </div>

          {error ? (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border-[1.5px] border-danger bg-danger-light px-4 py-3">
              <p className="font-medium text-danger">{t.common.loadError}</p>
              <button type="button" onClick={() => setReload((n) => n + 1)} className="min-h-[44px] rounded-full border-[1.5px] border-danger bg-white px-4 font-semibold text-danger">{t.common.retry}</button>
            </div>
          ) : clinics === null ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label={t.list.loading}>
              {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-[400px] animate-pulse rounded-[22px] bg-brand-tint motion-reduce:animate-none" />)}
            </div>
          ) : clinics.length === 0 ? (
            <div className="rounded-[22px] bg-brand-tint px-5 py-10 text-center">
              <p className="text-[16px] text-muted">{t.list.empty}</p>
              <button type="button" onClick={help.open} className="mt-3 min-h-[44px] font-semibold text-brand underline underline-offset-4">{t.list.emptyHelp}</button>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {clinics.map((c) => <li key={c.id} className="flex min-w-0"><ClinicTile clinic={c} /></li>)}
              </ul>
              {nextCursor && (
                <button type="button" onClick={loadMore} disabled={loadingMore}
                  className="mx-auto min-h-[48px] rounded-full border-[1.5px] border-brand px-6 font-semibold text-brand hover:bg-brand-light disabled:opacity-60">
                  {loadingMore ? t.list.loading : t.list.loadMore}
                </button>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
