"use client";

import { useId, useState, type KeyboardEvent } from "react";
import TextField from "@/components/TextField";
import type { DegreeLevel, ProfileInput } from "@/lib/api";
import type { OwnProfile } from "@/lib/doctorApi";
import { PhotoError, squarePhoto } from "@/lib/photo";
import { t } from "@/lib/strings";

// The doctor's professional details: one form, used at registration and on the profile page.

export type DegreeDraft = { key: number; level: DegreeLevel; name: string; institute: string; year: string };
export type ProfileDraft = {
  photo: string | null; // a new photo (data URL) waiting to be uploaded
  photoUrl: string | null; // the current photo, when editing
  specialisation: string;
  experienceYears: string;
  fee: string;
  registrationNo: string;
  medicalCouncil: string;
  degrees: DegreeDraft[];
  expertise: string[];
  achievements: string; // one per line
  about: string;
};
export type ProfileErrors = Partial<Record<string, string>>;

const LEVELS: DegreeLevel[] = ["UG", "PG", "SUPER_SPECIALITY", "FELLOWSHIP", "DIPLOMA", "OTHER"];
const SUGGESTED_DEGREES: Record<DegreeLevel, string[]> = {
  UG: ["MBBS", "BDS", "BAMS", "BHMS", "BUMS", "BPT"],
  PG: ["MD (General Medicine)", "MS (General Surgery)", "MS (Orthopaedics)", "MD (Paediatrics)", "MS (Obstetrics & Gynaecology)", "DNB", "MDS"],
  SUPER_SPECIALITY: ["DM (Cardiology)", "DM (Neurology)", "DM (Gastroenterology)", "MCh (Urology)", "MCh (Neurosurgery)"],
  FELLOWSHIP: ["Fellowship in Arthroplasty", "Fellowship in Sports Medicine", "FRCS", "MRCP"],
  DIPLOMA: ["DCH", "DGO", "D.Ortho", "DA"],
  OTHER: [],
};
const SPECIALISATIONS = [
  "General physician", "Orthopaedics", "Paediatrics", "Gynaecology", "Cardiology", "Dermatology", "ENT",
  "Ophthalmology", "Neurology", "Psychiatry", "General surgery", "Urology", "Gastroenterology", "Dentistry",
];
const MAX_YEAR = new Date().getFullYear();
let nextKey = 1;

export function emptyDraft(): ProfileDraft {
  return {
    photo: null, photoUrl: null, specialisation: "", experienceYears: "", fee: "", registrationNo: "", medicalCouncil: "",
    degrees: [{ key: nextKey++, level: "UG", name: "", institute: "", year: "" }],
    expertise: [], achievements: "", about: "",
  };
}

export function draftFromProfile(p: OwnProfile): ProfileDraft {
  return {
    photo: null,
    photoUrl: p.photoUrl,
    specialisation: p.specialisation ?? "",
    experienceYears: p.experienceYears != null ? String(p.experienceYears) : "",
    fee: p.fee != null ? String(p.fee) : "",
    registrationNo: p.registrationNo ?? "",
    medicalCouncil: p.medicalCouncil ?? "",
    degrees: p.degrees.length
      ? p.degrees.map((d) => ({ key: nextKey++, level: d.level, name: d.name, institute: d.institute ?? "", year: d.year ? String(d.year) : "" }))
      : fromQualification(p.qualification),
    expertise: p.expertise,
    achievements: p.achievements.join("\n"),
    about: p.about ?? "",
  };
}

/** Older accounts only have a one-line qualification ("MBBS, MS Ortho"): start from it, first as UG,
 *  the rest as PG, for the doctor to check before saving. */
function fromQualification(q: string | null): DegreeDraft[] {
  const names = (q ?? "").split(",").map((x) => x.trim()).filter((x) => x.length >= 2);
  if (!names.length) return emptyDraft().degrees;
  return names.map((name, i) => ({ key: nextKey++, level: i === 0 ? "UG" : "PG", name, institute: "", year: "" }));
}

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

/** Same rules as the backend, so most mistakes are caught before sending. Keys are field ids. */
export function validateDraft(d: ProfileDraft, photoRequired: boolean): ProfileErrors {
  const e: ProfileErrors = {};
  if (photoRequired && !d.photo && !d.photoUrl) e["profile-photo"] = t.profile.photoErrors.required;
  const exp = Number(d.experienceYears);
  if (d.experienceYears === "" || !Number.isInteger(exp) || exp < 0 || exp > 70) e["profile-experience"] = t.profile.errors.experience;
  const fee = Number(d.fee);
  if (d.fee === "" || !Number.isInteger(fee) || fee < 0 || fee > 100000) e["profile-fee"] = t.profile.errors.fee;
  if (!/^[A-Za-z0-9][A-Za-z0-9/.\- ]{1,28}[A-Za-z0-9]$/.test(d.registrationNo.trim())) e["profile-registration"] = t.profile.errors.registrationNo;
  const filled = d.degrees.filter((x) => x.name.trim() || x.institute.trim() || x.year);
  if (filled.length === 0) e[`degree-name-${d.degrees[0].key}`] = t.profile.errors.degrees;
  for (const x of filled) {
    if (x.name.trim().length < 2) e[`degree-name-${x.key}`] = t.profile.errors.degreeName;
    const y = Number(x.year);
    if (x.year && (!Number.isInteger(y) || y < 1950 || y > MAX_YEAR)) e[`degree-year-${x.key}`] = t.profile.errors.year(MAX_YEAR);
  }
  if (d.about.length > 1500) e["profile-about"] = t.profile.errors.about;
  const ach = lines(d.achievements);
  if (ach.length > 20 || ach.some((a) => a.length < 2 || a.length > 200)) e["profile-achievements"] = t.profile.errors.achievements;
  return e;
}

export function toInput(d: ProfileDraft): ProfileInput {
  return {
    ...(d.specialisation.trim() ? { specialisation: d.specialisation.trim() } : {}),
    experienceYears: Number(d.experienceYears),
    fee: Number(d.fee),
    registrationNo: d.registrationNo.trim(),
    ...(d.medicalCouncil.trim() ? { medicalCouncil: d.medicalCouncil.trim() } : {}),
    degrees: d.degrees
      .filter((x) => x.name.trim())
      .map((x) => ({
        level: x.level,
        name: x.name.trim(),
        ...(x.institute.trim() ? { institute: x.institute.trim() } : {}),
        ...(x.year ? { year: Number(x.year) } : {}),
      })),
    ...(d.photo ? { photo: d.photo } : {}),
    ...(d.about.trim() ? { about: d.about.trim() } : {}),
    achievements: lines(d.achievements),
    expertise: d.expertise,
  };
}

const input = "w-full rounded-xl border-[1.5px] bg-white px-3.5 py-3 text-base text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none";

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger">{error}</p> : null;
}

export default function ProfileFields({ draft, onChange, errors }: {
  draft: ProfileDraft;
  onChange: (d: ProfileDraft) => void;
  errors: ProfileErrors;
}) {
  const set = (patch: Partial<ProfileDraft>) => onChange({ ...draft, ...patch });
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [expertiseText, setExpertiseText] = useState("");
  const listId = useId();

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      set({ photo: await squarePhoto(file) });
    } catch (err) {
      setPhotoError(t.profile.photoErrors[err instanceof PhotoError ? err.message : "unreadable"]);
    } finally {
      setPhotoBusy(false);
    }
  }

  function updateDegree(key: number, patch: Partial<DegreeDraft>) {
    set({ degrees: draft.degrees.map((x) => (x.key === key ? { ...x, ...patch } : x)) });
  }

  function addExpertise() {
    const v = expertiseText.replace(/\s+/g, " ").trim();
    if (v.length >= 2 && v.length <= 60 && draft.expertise.length < 20 && !draft.expertise.some((x) => x.toLowerCase() === v.toLowerCase())) {
      set({ expertise: [...draft.expertise, v] });
    }
    setExpertiseText("");
  }
  function onExpertiseKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addExpertise();
    }
  }

  const photoSrc = draft.photo ?? draft.photoUrl;
  const photoErr = photoError || errors["profile-photo"];

  return (
    <div className="flex flex-col gap-6">
      {/* Photo */}
      <div>
        <p className="mb-1.5 font-semibold text-ink">{t.profile.photo}</p>
        <div className="flex items-center gap-4">
          <span className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] bg-brand-tint ${photoErr ? "border-danger" : "border-line"}`}>
            {photoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoSrc} alt={t.profile.photoAlt} className="h-full w-full object-cover" />
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-muted" aria-hidden="true">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-photo" className="inline-flex w-fit cursor-pointer items-center rounded-full border-[1.5px] border-brand bg-white px-4 py-2 font-semibold text-brand hover:bg-brand-light focus-within:outline focus-within:outline-[3px] focus-within:outline-token">
              {photoBusy ? "…" : photoSrc ? t.profile.changePhoto : t.profile.choosePhoto}
              <input
                id="profile-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                className="sr-only"
                aria-describedby={photoErr ? "profile-photo-error" : "profile-photo-hint"}
                aria-invalid={photoErr ? true : undefined}
                onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ""; }}
              />
            </label>
            {!photoErr && <p id="profile-photo-hint" className="text-sm text-muted">{t.profile.photoHint}</p>}
            <FieldError id="profile-photo" error={photoErr} />
          </div>
        </div>
      </div>

      {/* Specialisation, experience, fee */}
      <div>
        <TextField id="profile-specialisation" label={t.profile.specialisation} hint={t.profile.specialisationHint} list={`${listId}-spec`}
          value={draft.specialisation} onChange={(e) => set({ specialisation: e.target.value })} maxLength={80} />
        <datalist id={`${listId}-spec`}>{SPECIALISATIONS.map((s) => <option key={s} value={s} />)}</datalist>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="profile-experience" label={t.profile.experience} inputMode="numeric" maxLength={2} value={draft.experienceYears}
          onChange={(e) => set({ experienceYears: e.target.value.replace(/\D/g, "") })} error={errors["profile-experience"]} />
        <TextField id="profile-fee" label={t.profile.fee} prefix="₹" inputMode="numeric" maxLength={6} value={draft.fee}
          onChange={(e) => set({ fee: e.target.value.replace(/\D/g, "") })} error={errors["profile-fee"]} hint={t.profile.feeHint} />
      </div>

      {/* Registration */}
      <div className="grid gap-5">
        <TextField id="profile-registration" label={t.profile.registrationNo} value={draft.registrationNo} maxLength={30} autoComplete="off"
          onChange={(e) => set({ registrationNo: e.target.value })} error={errors["profile-registration"]} hint={t.profile.registrationHint} />
        <TextField id="profile-council" label={t.profile.council} value={draft.medicalCouncil} maxLength={100}
          onChange={(e) => set({ medicalCouncil: e.target.value })} hint={t.profile.councilHint} />
      </div>

      {/* Degrees */}
      <fieldset>
        <legend className="font-semibold text-ink">{t.profile.degrees}</legend>
        <p className="mb-3 text-sm text-muted">{t.profile.degreesHint}</p>
        <ul className="flex flex-col gap-3">
          {draft.degrees.map((d, i) => {
            const nameErr = errors[`degree-name-${d.key}`];
            const yearErr = errors[`degree-year-${d.key}`];
            return (
              <li key={d.key} className="rounded-2xl border border-line p-3">
                <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
                  <div>
                    <label htmlFor={`degree-level-${d.key}`} className="mb-1 block text-sm font-semibold">{t.profile.degreeLevel}</label>
                    <select id={`degree-level-${d.key}`} value={d.level} onChange={(e) => updateDegree(d.key, { level: e.target.value as DegreeLevel })} className={`${input} border-line py-2.5`}>
                      {LEVELS.map((l) => <option key={l} value={l}>{t.profile.levels[l]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`degree-name-${d.key}`} className="mb-1 block text-sm font-semibold">{t.profile.degreeName}</label>
                    <input id={`degree-name-${d.key}`} list={`${listId}-deg-${d.level}`} placeholder={t.profile.degreeNamePlaceholder} maxLength={100}
                      value={d.name} onChange={(e) => updateDegree(d.key, { name: e.target.value })}
                      aria-invalid={nameErr ? true : undefined} aria-describedby={nameErr ? `degree-name-${d.key}-error` : undefined}
                      className={`${input} py-2.5 ${nameErr ? "border-danger" : "border-line"}`} />
                    <FieldError id={`degree-name-${d.key}`} error={nameErr} />
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_auto] sm:items-end">
                  <div>
                    <label htmlFor={`degree-institute-${d.key}`} className="mb-1 block text-sm font-semibold">{t.profile.institute}</label>
                    <input id={`degree-institute-${d.key}`} maxLength={150} value={d.institute} onChange={(e) => updateDegree(d.key, { institute: e.target.value })} className={`${input} border-line py-2.5`} />
                  </div>
                  <div>
                    <label htmlFor={`degree-year-${d.key}`} className="mb-1 block text-sm font-semibold">{t.profile.year}</label>
                    <input id={`degree-year-${d.key}`} inputMode="numeric" maxLength={4} placeholder="2010" value={d.year}
                      onChange={(e) => updateDegree(d.key, { year: e.target.value.replace(/\D/g, "") })}
                      aria-invalid={yearErr ? true : undefined} aria-describedby={yearErr ? `degree-year-${d.key}-error` : undefined}
                      className={`${input} py-2.5 ${yearErr ? "border-danger" : "border-line"}`} />
                  </div>
                  {draft.degrees.length > 1 && (
                    <button type="button" onClick={() => set({ degrees: draft.degrees.filter((x) => x.key !== d.key) })}
                      className="rounded-full px-3 py-2.5 text-sm font-semibold text-danger hover:bg-danger-light" aria-label={t.profile.removeDegree(i + 1)}>
                      ✕
                    </button>
                  )}
                </div>
                <FieldError id={`degree-year-${d.key}`} error={yearErr} />
              </li>
            );
          })}
        </ul>
        {LEVELS.map((l) => <datalist key={l} id={`${listId}-deg-${l}`}>{SUGGESTED_DEGREES[l].map((n) => <option key={n} value={n} />)}</datalist>)}
        {draft.degrees.length < 15 && (
          <button type="button" onClick={() => set({ degrees: [...draft.degrees, { key: nextKey++, level: "PG", name: "", institute: "", year: "" }] })}
            className="mt-3 rounded-full border-[1.5px] border-dashed border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light">
            + {t.profile.addDegree}
          </button>
        )}
      </fieldset>

      {/* Expertise */}
      <div>
        <label htmlFor="profile-expertise" className="mb-1.5 block font-semibold text-ink">{t.profile.expertise}</label>
        <div className="flex gap-2">
          <input id="profile-expertise" value={expertiseText} maxLength={60} placeholder={t.profile.expertisePlaceholder}
            onChange={(e) => setExpertiseText(e.target.value)} onKeyDown={onExpertiseKey} aria-describedby="profile-expertise-hint"
            className={`${input} border-line`} />
          <button type="button" onClick={addExpertise} className="shrink-0 rounded-full border-[1.5px] border-brand px-4 font-semibold text-brand hover:bg-brand-light">{t.profile.addExpertise}</button>
        </div>
        <p id="profile-expertise-hint" className="mt-1.5 text-sm text-muted">{t.profile.expertiseHint}</p>
        {draft.expertise.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {draft.expertise.map((x) => (
              <li key={x} className="flex items-center gap-1 rounded-full bg-brand-light py-1 pl-3 pr-1 text-sm font-semibold text-brand-dark">
                {x}
                <button type="button" onClick={() => set({ expertise: draft.expertise.filter((y) => y !== x) })} aria-label={t.profile.removeExpertise(x)}
                  className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white">×</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Achievements and about */}
      <div>
        <label htmlFor="profile-achievements" className="mb-1.5 block font-semibold text-ink">{t.profile.achievements}</label>
        <textarea id="profile-achievements" rows={3} value={draft.achievements} onChange={(e) => set({ achievements: e.target.value })}
          aria-describedby={errors["profile-achievements"] ? "profile-achievements-error" : "profile-achievements-hint"}
          className={`${input} ${errors["profile-achievements"] ? "border-danger" : "border-line"}`} />
        {errors["profile-achievements"] ? <FieldError id="profile-achievements" error={errors["profile-achievements"]} /> : <p id="profile-achievements-hint" className="mt-1.5 text-sm text-muted">{t.profile.achievementsHint}</p>}
      </div>
      <div>
        <label htmlFor="profile-about" className="mb-1.5 block font-semibold text-ink">{t.profile.about}</label>
        <textarea id="profile-about" rows={4} maxLength={1500} value={draft.about} onChange={(e) => set({ about: e.target.value })}
          aria-describedby="profile-about-hint" className={`${input} ${errors["profile-about"] ? "border-danger" : "border-line"}`} />
        <p id="profile-about-hint" className="mt-1.5 flex justify-between gap-3 text-sm text-muted">
          <span>{t.profile.aboutHint}</span><span className="tabular-nums">{t.profile.chars(draft.about.length, 1500)}</span>
        </p>
        <FieldError id="profile-about" error={errors["profile-about"]} />
      </div>
    </div>
  );
}
