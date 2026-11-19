"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { saveToken } from "@/lib/myTokens";
import {
  createBooking,
  getAvailability,
  trackingPath,
  USE_SAMPLE_DATA,
  type Availability,
  type BookingDay,
  type Gender,
  type VisitType,
} from "@/lib/patientApi";
import { addDays, shortTime, todayIST } from "@/lib/time";
import { isIndianMobile } from "@/lib/validation";
import { useAccount } from "./AccountProvider";
import { ChevronLeft } from "./icons";
import PatientHeader from "./PatientHeader";

type Field = "day" | "name" | "mobile" | "age" | "gender";
type Errors = Partial<Record<Field, string>>;

const GENDERS: Gender[] = ["MALE", "FEMALE", "OTHER"];
const VISITS: VisitType[] = ["NEW", "FOLLOW_UP", "REPORT_REVIEW"];

/** Choose a day, add the patient, get a token. Payment is at the clinic. */
export default function BookScreen({ doctorClinicId }: { doctorClinicId: string }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [info, setInfo] = useState<Availability | null>(null);
  const [loadError, setLoadError] = useState("");
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [visit, setVisit] = useState<VisitType>("NEW");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const { me, refresh } = useAccount();
  // Signed in: who the token is for (a profile in the account), or "guest" for someone else.
  const [who, setWho] = useState<string>("");

  function choose(id: string) {
    setWho(id);
    setErrors({});
    const m = me?.members.find((x) => x.id === id);
    if (!m) {
      setName(""); setMobile(""); setAge(""); setGender(""); setConsent(false);
      return;
    }
    setName(m.name);
    setMobile(m.phone ?? me?.account.phone ?? "");
    setAge(m.age != null ? String(m.age) : "");
    setGender(m.gender ?? "");
    setConsent(m.recordsConsent);
  }

  // Once the account has loaded, start with the patient themselves.
  useEffect(() => {
    if (me && !who && me.members[0]) choose(me.members[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  useEffect(() => {
    if (USE_SAMPLE_DATA) return;
    getAvailability(doctorClinicId).then(
      (a) => {
        setInfo(a);
        // Start on the first day that can be booked.
        setDate((d) => d || (a.days.find((x) => x.bookable)?.date ?? ""));
      },
      (e) => setLoadError(e instanceof ApiError ? e.message : t.common.loadError),
    );
  }, [doctorClinicId, t.common.loadError]);

  const today = todayIST();
  const dayName = (d: string) =>
    d === today ? t.book.today : d === addDays(today, 1) ? t.book.tomorrow
      : new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));
  const dayNum = (d: string) =>
    new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));
  const dayState = (d: BookingDay) =>
    d.bookable ? (d.left != null ? t.book.left(d.left) : d.start && d.end ? t.book.hours(shortTime(d.start), shortTime(d.end)) : "")
      : d.reason === "FULL" ? t.book.full : d.reason === "HOURS_OVER" ? t.book.over : t.book.off;

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!info) return;
    const e: Errors = {};
    const ageNum = Number(age);
    if (!date) e.day = t.book.errors.day;
    if (name.trim().length < 2) e.name = t.book.errors.name;
    if (!isIndianMobile(mobile)) e.mobile = t.book.errors.mobile;
    if (age === "" || !Number.isInteger(ageNum) || ageNum < 0 || ageNum > 120) e.age = t.book.errors.age;
    if (!gender) e.gender = t.book.errors.gender;
    setErrors(e);
    setServerError("");
    const first = (["day", "name", "mobile", "age", "gender"] as Field[]).find((k) => e[k]);
    if (first) {
      document.getElementById(`book-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const r = await createBooking({
        doctorClinicId: info.doctorClinicId,
        date,
        visitType: visit,
        patient: { name: name.trim(), phone: mobile, age: ageNum, gender: gender as Gender },
        recordsConsent: consent,
        ...(who && who !== "guest" ? { memberId: who } : {}),
      });
      if (who && who !== "guest") refresh();
      // Signed in: the token is in the account. Otherwise keep it on this phone to find it again.
      if (!me) saveToken({
        bookingId: r.bookingId, code: r.trackingCode, token: r.token, date,
        doctorName: info.doctor.name, clinicName: info.clinic.name, patientName: name.trim(),
      });
      router.push(trackingPath(r.bookingId, r.trackingCode));
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t.common.loadError);
      setBusy(false);
    }
  }

  const field = "w-full rounded-xl border-[1.5px] bg-white px-3.5 py-3 text-base text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none";
  const errorText = (k: Field) => errors[k] && <p id={`book-${k}-error`} className="mt-1.5 text-sm font-medium text-danger">{errors[k]}</p>;
  const described = (k: Field) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `book-${k}-error` : undefined });

  let body;
  if (USE_SAMPLE_DATA) {
    body = <p className="rounded-2xl bg-brand-tint px-4 py-6 text-center text-muted">{t.book.sampleOnly}</p>;
  } else if (loadError) {
    body = (
      <div role="alert" className="rounded-[22px] border-[1.5px] border-danger bg-danger-light px-4 py-4">
        <p className="font-medium text-danger">{loadError}</p>
        <Link href="/" className="mt-3 inline-flex min-h-[44px] items-center font-semibold text-brand underline underline-offset-4">{t.placeholder.home}</Link>
      </div>
    );
  } else if (!info) {
    body = <div className="h-[420px] animate-pulse rounded-[22px] bg-brand-tint motion-reduce:animate-none" aria-label={t.list.loading} />;
  } else {
    const doctorName = lang === "hi" && info.doctor.nameHi ? info.doctor.nameHi : info.doctor.name;
    const clinicName = lang === "hi" && info.clinic.nameHi ? info.clinic.nameHi : info.clinic.name;
    const anyBookable = info.days.some((d) => d.bookable);
    body = (
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <section className="rounded-[22px] border border-line bg-white p-4 shadow-soft">
          <p className="text-lg font-bold text-ink">{doctorName}</p>
          {(info.doctor.designation || info.doctor.department) && <p className="text-[15px] font-semibold text-brand-dark">{info.doctor.designation || info.doctor.department}</p>}
          <p className="mt-1 text-[15px] text-muted">{clinicName}, {info.clinic.area}</p>
          <p className="mt-2 text-[16px] font-bold text-ink">{t.book.fee(info.fee)}</p>
        </section>

        <fieldset>
          <legend className="mb-2 text-lg font-bold text-ink">{t.book.chooseDay}</legend>
          {!anyBookable ? (
            <p className="rounded-2xl bg-brand-tint px-4 py-5 text-muted">{t.book.noDays}</p>
          ) : (
            <div id="book-day" tabIndex={-1} className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
              {info.days.map((d) => (
                <label key={d.date} className={`flex min-w-[92px] shrink-0 flex-col items-center rounded-2xl border-[1.5px] px-3 py-2.5 text-center ${
                  !d.bookable ? "cursor-not-allowed border-line bg-brand-tint/60 text-muted" : date === d.date ? "cursor-pointer border-brand bg-brand text-white" : "cursor-pointer border-line bg-white text-ink hover:border-brand"}`}>
                  <input type="radio" name="day" value={d.date} checked={date === d.date} disabled={!d.bookable} onChange={() => setDate(d.date)} className="sr-only" />
                  <span className="text-[15px] font-bold">{dayName(d.date)}</span>
                  <span className="text-sm">{dayNum(d.date)}</span>
                  <span className={`mt-0.5 text-xs font-semibold ${date === d.date && d.bookable ? "text-white" : d.bookable ? "text-brand-dark" : ""}`}>{dayState(d)}</span>
                </label>
              ))}
            </div>
          )}
          {errorText("day")}
          {info.days.find((d) => d.date === date)?.note && <p className="mt-2 text-[15px] text-muted">{info.days.find((d) => d.date === date)?.note}</p>}
        </fieldset>

        <fieldset className="flex flex-col gap-4" disabled={!anyBookable}>
          <legend className="mb-2 text-lg font-bold text-ink">{t.book.patient}</legend>
          {me ? (
            <div role="radiogroup" aria-label={t.book.who} className="no-scrollbar -mx-4 -mt-1 flex gap-2 overflow-x-auto px-4">
              {[...me.members.map((m) => ({ id: m.id, label: m.relation === "SELF" ? `${m.name} (${t.book.you})` : m.name })), { id: "guest", label: t.book.someoneElse }].map((o) => (
                <button key={o.id} type="button" role="radio" aria-checked={who === o.id} onClick={() => choose(o.id)}
                  className={`min-h-[44px] shrink-0 rounded-full border-[1.5px] px-4 text-[15px] font-semibold ${who === o.id ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          ) : me === null && (
            <p className="-mt-1 rounded-2xl bg-brand-tint px-4 py-3 text-[15px] text-ink">
              {t.book.signInPrompt}{" "}
              <Link href={`/login?next=${encodeURIComponent(`/book/${doctorClinicId}`)}`} className="font-semibold text-brand underline underline-offset-4">{t.auth.signIn}</Link>
            </p>
          )}
          <div>
            <label htmlFor="book-name" className="mb-1.5 block font-semibold">{t.book.name}</label>
            <input id="book-name" autoComplete="name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} {...described("name")}
              className={`${field} ${errors.name ? "border-danger" : "border-line"}`} />
            {errorText("name")}
          </div>
          <div>
            <label htmlFor="book-mobile" className="mb-1.5 block font-semibold">{t.book.mobile}</label>
            <div className={`flex overflow-hidden rounded-xl border-[1.5px] focus-within:border-brand ${errors.mobile ? "border-danger" : "border-line"}`}>
              <span className="flex items-center border-r border-line bg-brand-tint px-3 font-semibold text-muted">+91</span>
              <input id="book-mobile" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} {...described("mobile")}
                className="min-w-0 flex-1 bg-white px-3.5 py-3 text-base focus:outline-none" />
            </div>
            {errors.mobile ? errorText("mobile") : <p className="mt-1.5 text-sm text-muted">{t.book.mobileHint}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="book-age" className="mb-1.5 block font-semibold">{t.book.age}</label>
              <input id="book-age" inputMode="numeric" maxLength={3} value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} {...described("age")}
                className={`${field} ${errors.age ? "border-danger" : "border-line"}`} />
              {errorText("age")}
            </div>
            <div>
              <label htmlFor="book-gender" className="mb-1.5 block font-semibold">{t.book.gender}</label>
              <select id="book-gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)} {...described("gender")}
                className={`${field} min-h-[50px] ${errors.gender ? "border-danger" : "border-line"}`}>
                <option value="" disabled>{t.location.choose}</option>
                {GENDERS.map((g) => <option key={g} value={g}>{t.book.genders[g]}</option>)}
              </select>
              {errorText("gender")}
            </div>
          </div>
          <div role="radiogroup" aria-label={t.book.visit}>
            <p className="mb-1.5 font-semibold" aria-hidden="true">{t.book.visit}</p>
            <div className="flex flex-wrap gap-2">
              {VISITS.map((v) => (
                <button key={v} type="button" role="radio" aria-checked={visit === v} onClick={() => setVisit(v)}
                  className={`min-h-[44px] rounded-full border-[1.5px] px-4 text-[15px] font-semibold ${visit === v ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"}`}>
                  {t.book.visits[v]}
                </button>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-[15px] text-ink">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
            {t.book.consent}
          </label>
        </fieldset>

        {serverError && <p role="alert" className="rounded-xl bg-danger-light px-4 py-3 font-medium text-danger">{serverError}</p>}
        <button type="submit" disabled={busy || !anyBookable}
          className="min-h-[52px] rounded-full bg-brand px-6 text-[17px] font-semibold text-white shadow-soft hover:bg-brand-dark disabled:opacity-60">
          {busy ? t.book.booking : t.book.submit}
        </button>
      </form>
    );
  }

  return (
    <>
      <PatientHeader />
      <main className="mx-auto flex max-w-[640px] flex-col gap-5 px-4 pb-10 pt-4 sm:pt-8">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))} aria-label={t.common.back}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-brand-tint">
            <ChevronLeft />
          </button>
          <h1 className="text-[24px] font-bold text-ink">{t.book.title}</h1>
        </div>
        {body}
      </main>
    </>
  );
}
