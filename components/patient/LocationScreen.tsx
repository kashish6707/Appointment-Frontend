"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAreas, getDistricts, getStates, USE_SAMPLE_DATA, type Area, type District, type State } from "@/lib/patientApi";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { loadLocation, saveLocation } from "@/lib/location";
import { ChevronLeft, SearchIcon, TargetIcon } from "./icons";

type GeoState = { kind: "idle" } | { kind: "locating" } | { kind: "found"; area: string } | { kind: "error"; message: string };

function nearest(areas: Area[], lat: number, lng: number): Area | undefined {
  const d = (a: Area) => (a.lat == null || a.lng == null ? Infinity : (a.lat - lat) ** 2 + ((a.lng - lng) * Math.cos((lat * Math.PI) / 180)) ** 2);
  return [...areas].sort((a, b) => d(a) - d(b))[0];
}

export default function LocationScreen() {
  const { t, lang } = useLang();
  const router = useRouter();
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [search, setSearch] = useState("");
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [geo, setGeo] = useState<GeoState>({ kind: "idle" });
  const [error, setError] = useState(false);

  const label = (x: { name: string; nameHi: string }) => (lang === "hi" ? x.nameHi : x.name);

  // Start from the saved choice, if any.
  useEffect(() => {
    getStates().then(setStates);
    const saved = loadLocation();
    if (saved) {
      setStateId(saved.stateId);
      setDistrictId(saved.districtId);
      setAreaId(saved.areaId);
    }
  }, []);

  useEffect(() => {
    if (!stateId) return setDistricts([]);
    getDistricts(stateId).then(setDistricts);
  }, [stateId]);

  useEffect(() => {
    if (!districtId) return setAreas([]);
    let stale = false;
    setError(false);
    getAreas(districtId, search).then((a) => !stale && setAreas(a), () => !stale && setError(true));
    return () => {
      stale = true;
    };
  }, [districtId, search]);

  async function useCurrent() {
    if (!("geolocation" in navigator)) return setGeo({ kind: "error", message: t.location.unavailable });
    setGeo({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const patna = await getAreas("patna").catch(() => [] as Area[]);
        // Sample data only covers Patna: pick Kankarbagh. Otherwise the nearest Patna area.
        const found = USE_SAMPLE_DATA ? patna.find((a) => a.id === "kankarbagh") : nearest(patna, pos.coords.latitude, pos.coords.longitude);
        if (!found) return setGeo({ kind: "error", message: t.location.unavailable });
        setStateId("bihar");
        setDistrictId("patna");
        setAreaId(found.id);
        setSearch("");
        setPoint(USE_SAMPLE_DATA ? null : { lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeo({ kind: "found", area: label(found) });
      },
      (err) => setGeo({ kind: "error", message: err.code === err.PERMISSION_DENIED ? t.location.denied : t.location.unavailable }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  const state = states.find((s) => s.id === stateId);
  const district = districts.find((d) => d.id === districtId);
  const area = areas.find((a) => a.id === areaId);

  function confirm() {
    if (!state || !district || !area) return;
    saveLocation({
      stateId: state.id, stateName: state.name, districtId: district.id, districtName: district.name,
      areaId: area.id, areaName: area.name, backendAreaId: area.backendId,
      ...(point ? point : area.lat != null ? { lat: area.lat, lng: area.lng } : {}),
    });
    router.push("/");
  }

  const select = "min-h-[52px] w-full rounded-xl border-[1.5px] border-line bg-white px-3.5 text-base text-ink focus:border-brand focus:outline-none disabled:bg-brand-tint disabled:text-muted";

  return (
    <main className="mx-auto flex max-w-[640px] flex-col gap-5 px-4 pb-8 pt-4 sm:pt-8">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => router.back()} aria-label={t.common.back} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-brand-tint">
          <ChevronLeft />
        </button>
        <h1 className="text-[24px] font-bold text-ink">{t.location.title}</h1>
      </div>

      <div className="flex flex-col gap-2">
        <button type="button" onClick={useCurrent} disabled={geo.kind === "locating"}
          className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full border-[1.5px] border-brand bg-brand-light px-5 text-[16px] font-semibold text-brand-dark hover:bg-brand-tint disabled:opacity-60">
          <TargetIcon /> {geo.kind === "locating" ? t.location.locating : t.location.useCurrent}
        </button>
        <div aria-live="polite">
          {geo.kind === "found" && <p className="text-center text-[15px] font-semibold text-brand-dark">{t.location.found(geo.area)}</p>}
          {geo.kind === "error" && <p className="rounded-xl bg-danger-light px-4 py-3 text-[15px] font-medium text-[#7E2318]">{geo.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm font-semibold text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />{t.location.or}<span className="h-px flex-1 bg-line" />
      </div>

      <div>
        <label htmlFor="loc-state" className="mb-1.5 block font-semibold text-ink">{t.location.state}</label>
        <select id="loc-state" value={stateId} onChange={(e) => { setStateId(e.target.value); setDistrictId(""); setAreaId(""); setPoint(null); }} className={select}>
          <option value="" disabled>{t.location.choose}</option>
          {states.map((s) => <option key={s.id} value={s.id}>{label(s)}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="loc-district" className="mb-1.5 block font-semibold text-ink">{t.location.district}</label>
        <select id="loc-district" value={districtId} disabled={!stateId} onChange={(e) => { setDistrictId(e.target.value); setAreaId(""); setSearch(""); setPoint(null); }} className={select}>
          <option value="" disabled>{t.location.choose}</option>
          {districts.map((d) => <option key={d.id} value={d.id}>{label(d)}</option>)}
        </select>
      </div>

      <fieldset disabled={!districtId} className="disabled:opacity-60">
        <legend className="mb-1.5 font-semibold text-ink">{t.location.area}</legend>
        <div className="flex items-center gap-2 rounded-xl border-[1.5px] border-line bg-white px-3.5 focus-within:border-brand">
          <span className="text-brand"><SearchIcon size={20} /></span>
          <label htmlFor="loc-search" className="sr-only">{t.location.searchArea}</label>
          <input id="loc-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.location.searchArea}
            className="min-h-[48px] min-w-0 flex-1 bg-transparent text-base focus:outline-none" />
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-danger">{t.common.loadError}</p>
        ) : (
          <ul className="mt-2 flex max-h-[340px] flex-col gap-1.5 overflow-y-auto">
            {districtId && areas.length === 0 && <li className="px-2 py-3 text-muted">{t.location.noAreas}</li>}
            {areas.map((a) => (
              <li key={a.id}>
                <label className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-3.5 ${areaId === a.id ? "border-brand bg-brand-light" : "border-line bg-white hover:border-brand"}`}>
                  <input type="radio" name="area" value={a.id} checked={areaId === a.id} onChange={() => { setAreaId(a.id); setPoint(null); }} className="h-5 w-5 accent-brand" />
                  <span className="flex-1 font-semibold text-ink">{label(a)}</span>
                  {a.doctorCount != null && <span className="text-sm text-muted">{t.location.doctors(a.doctorCount)}</span>}
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <button type="button" onClick={confirm} disabled={!area || !district}
        className="sticky bottom-[84px] min-h-[52px] rounded-full bg-brand px-6 text-[17px] font-semibold text-white shadow-soft hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 md:static">
        {area && district ? t.location.confirm(label(area), label(district)) : t.location.pick}
      </button>
    </main>
  );
}
