"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useLang } from "@/lib/i18n/LanguageProvider";
import {
  addMember,
  BLOOD_GROUPS,
  RELATIONS,
  removeMember,
  toInput,
  updateMember,
  type Gender,
  type Member,
  type MemberInput,
  type Relation,
} from "@/lib/patientAccount";
import { isIndianMobile } from "@/lib/validation";
import { useAccount } from "./AccountProvider";
import { ChevronLeft, ChevronRight } from "./icons";
import PatientHeader from "./PatientHeader";

const field = "w-full rounded-xl border-[1.5px] bg-white px-3.5 py-3 text-base text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none";
const primary = "inline-flex min-h-[48px] items-center justify-center rounded-full bg-brand px-6 text-[16px] font-semibold text-white hover:bg-brand-dark disabled:opacity-60";
const outline = "inline-flex min-h-[48px] items-center justify-center rounded-full border-[1.5px] border-brand px-6 text-[16px] font-semibold text-brand hover:bg-brand-light";

/** Shown on account pages when nobody is signed in. */
export function SignedOut({ text, next }: { text: string; next: string }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center gap-3 rounded-[22px] bg-brand-tint px-5 py-10 text-center">
      <p className="text-[16px] text-ink">{text}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2.5">
        <Link href={`/login?next=${encodeURIComponent(next)}`} className={primary}>{t.auth.signIn}</Link>
        <Link href={`/register?next=${encodeURIComponent(next)}`} className={outline}>{t.auth.createAccount}</Link>
      </div>
    </div>
  );
}

function Page({ title, back, children }: { title: string; back?: string; children: ReactNode }) {
  const { t } = useLang();
  return (
    <>
      <PatientHeader />
      <main className="mx-auto flex max-w-[680px] flex-col gap-5 px-4 pb-10 pt-4 sm:pt-8">
        <div className="flex items-center gap-2">
          {back && (
            <Link href={back} aria-label={t.common.back} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-brand-tint">
              <ChevronLeft />
            </Link>
          )}
          <h1 className="text-[24px] font-bold text-ink">{title}</h1>
        </div>
        {children}
      </main>
    </>
  );
}

/** How much of a profile is filled in, to nudge without nagging. */
function missing(m: Member): number {
  return [m.age ?? m.dateOfBirth, m.gender, m.bloodGroup, m.emergencyPhone].filter((v) => v == null || v === "").length;
}

export function ProfileScreen() {
  const { t } = useLang();
  const { me, signOut } = useAccount();
  const router = useRouter();

  if (me === undefined) return <Page title={t.profile.title}><div className="h-60 animate-pulse rounded-[22px] bg-brand-tint motion-reduce:animate-none" /></Page>;
  if (me === null) return <Page title={t.profile.title}><SignedOut text={t.profile.signedOut} next="/profile" /></Page>;

  return (
    <Page title={t.profile.title}>
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-line bg-white p-4 shadow-soft">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-ink">{me.account.fullName}</p>
          <p className="text-[15px] text-muted">{me.account.phone ? `+91 ${me.account.phone}` : me.account.email}</p>
        </div>
        <button type="button" onClick={async () => { await signOut(); router.push("/"); }}
          className="min-h-[44px] rounded-full border-[1.5px] border-line px-4 font-semibold text-ink hover:border-brand">
          {t.header.signOut}
        </button>
      </section>

      <section aria-labelledby="people-title" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="people-title" className="text-xl font-bold text-ink">{t.profile.people}</h2>
          <span className="text-[15px] text-muted">{t.profile.peopleHint}</span>
        </div>
        <ul className="flex flex-col gap-2.5">
          {me.members.map((m) => {
            const left = missing(m);
            return (
              <li key={m.id}>
                <Link href={`/profile/${m.id}`} className="flex items-center gap-4 rounded-[20px] border border-line bg-white p-4 hover:border-brand">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-light text-lg font-bold text-brand-dark">
                    {m.name.trim()[0]?.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-ink">{m.name}</span>
                    <span className="block text-[15px] text-muted">
                      {t.profile.relations[m.relation]}
                      {m.age != null ? ` · ${t.profile.years(m.age)}` : ""}
                      {m.bloodGroup ? ` · ${m.bloodGroup}` : ""}
                    </span>
                    {left > 0 && <span className="mt-1 inline-block rounded-full bg-[#FFF4DE] px-2.5 py-0.5 text-sm font-semibold text-[#7A4B00]">{t.profile.addDetails}</span>}
                  </span>
                  <span className="text-muted"><ChevronRight /></span>
                </Link>
              </li>
            );
          })}
        </ul>
        {me.members.length < 8 && (
          <Link href="/profile/new" className={`${outline} self-start`}>+ {t.profile.addPerson}</Link>
        )}
      </section>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Link href="/records" className="rounded-[20px] border border-line bg-white p-4 font-semibold text-ink hover:border-brand">{t.header.myRecords} →</Link>
        <Link href="/tokens" className="rounded-[20px] border border-line bg-white p-4 font-semibold text-ink hover:border-brand">{t.header.myTokens} →</Link>
      </div>
    </Page>
  );
}

const EMPTY: MemberInput = {
  name: "", relation: "MOTHER", phone: null, dateOfBirth: null, age: null, gender: null, heightCm: null, weightKg: null,
  bloodGroup: null, allergies: null, conditions: null, surgeries: null, medicines: null, emergencyName: null,
  emergencyRelation: null, emergencyPhone: null, addressArea: null, addressCity: null, recordsConsent: false,
};

type Errors = Partial<Record<"name" | "age" | "dateOfBirth" | "phone" | "emergencyPhone" | "heightCm" | "weightKg", string>>;

/** Add a family member (memberId "new") or edit someone in the account. */
export function MemberScreen({ memberId }: { memberId: string }) {
  const { t } = useLang();
  const router = useRouter();
  const welcome = useSearchParams().get("welcome") === "1";
  const { me, refresh } = useAccount();
  const isNew = memberId === "new";
  const member = me?.members.find((m) => m.id === memberId);
  const [form, setForm] = useState<MemberInput | null>(isNew ? EMPTY : null);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const removeDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!isNew && member && form === null) setForm(toInput(member));
  }, [isNew, member, form]);

  if (me === undefined) return <Page title={t.profile.title} back="/profile"><div className="h-60 animate-pulse rounded-[22px] bg-brand-tint motion-reduce:animate-none" /></Page>;
  if (me === null) return <Page title={t.profile.title}><SignedOut text={t.profile.signedOut} next={`/profile/${memberId}`} /></Page>;
  if (!isNew && !member) return <Page title={t.profile.title} back="/profile"><p className="text-muted">{t.profile.notFound}</p></Page>;
  if (!form) return null;

  const isSelf = form.relation === "SELF";
  const set = <K extends keyof MemberInput>(k: K, v: MemberInput[K]) => { setForm({ ...form, [k]: v }); setSaved(false); };
  const text = (k: keyof MemberInput) => (form[k] as string | null) ?? "";
  const num = (v: string) => (v === "" ? null : Number(v));

  async function save(ev: FormEvent) {
    ev.preventDefault();
    if (!form) return;
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = t.profile.errors.name;
    if (form.age != null && (!Number.isInteger(form.age) || form.age < 0 || form.age > 120)) e.age = t.profile.errors.age;
    if (form.phone && !isIndianMobile(form.phone)) e.phone = t.profile.errors.phone;
    if (form.emergencyPhone && !isIndianMobile(form.emergencyPhone)) e.emergencyPhone = t.profile.errors.phone;
    if (form.heightCm != null && (form.heightCm < 30 || form.heightCm > 250)) e.heightCm = t.profile.errors.height;
    if (form.weightKg != null && (form.weightKg < 1 || form.weightKg > 300)) e.weightKg = t.profile.errors.weight;
    setErrors(e);
    setServerError("");
    const first = Object.keys(e)[0];
    if (first) return document.getElementById(`m-${first}`)?.focus();
    setBusy(true);
    try {
      const body = { ...form, name: form.name.trim(), age: form.dateOfBirth ? null : form.age };
      if (isNew) {
        const created = await addMember(body);
        await refresh();
        router.replace(`/profile/${created.id}`);
      } else {
        const updated = await updateMember(memberId, body);
        setForm(toInput(updated));
        await refresh();
        setSaved(true);
      }
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t.common.loadError);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await removeMember(memberId);
      await refresh();
      router.push("/profile");
    } catch (err) {
      removeDialog.current?.close();
      setServerError(err instanceof ApiError ? err.message : t.common.loadError);
      setBusy(false);
    }
  }

  const err = (k: keyof Errors) => errors[k] && <p id={`m-${k}-error`} className="mt-1.5 text-sm font-medium text-danger">{errors[k]}</p>;
  const aria = (k: keyof Errors) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `m-${k}-error` : undefined });
  const cls = (k?: keyof Errors) => `${field} ${k && errors[k] ? "border-danger" : "border-line"}`;
  const label = (id: string, text: string, optional = true) => (
    <label htmlFor={id} className="mb-1.5 block font-semibold text-ink">{text}{optional && <span className="font-normal text-muted"> {t.profile.optional}</span>}</label>
  );

  return (
    <Page title={isNew ? t.profile.addPerson : isSelf ? t.profile.yourDetails : form.name || t.profile.title} back="/profile">
      {welcome && <p className="rounded-2xl bg-brand-light px-4 py-3 font-semibold text-brand-dark">{t.profile.welcome}</p>}
      <form onSubmit={save} noValidate className="flex flex-col gap-6">
        <Section title={t.profile.sections.basic}>
          <div>
            {label("m-name", t.profile.name, false)}
            <input id="m-name" value={form.name} maxLength={100} onChange={(e) => set("name", e.target.value)} {...aria("name")} className={cls("name")} />
            {err("name")}
          </div>
          {!isSelf && (
            <div>
              {label("m-relation", t.profile.relation, false)}
              <select id="m-relation" value={form.relation} onChange={(e) => set("relation", e.target.value as Relation)} className={`${cls()} min-h-[50px]`}>
                {RELATIONS.map((r) => <option key={r} value={r}>{t.profile.relations[r]}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              {label("m-dateOfBirth", t.profile.dob)}
              <input id="m-dateOfBirth" type="date" value={text("dateOfBirth")} max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => set("dateOfBirth", e.target.value || null)} className={`${cls()} min-h-[50px]`} />
            </div>
            <div>
              {label("m-age", t.profile.age)}
              <input id="m-age" inputMode="numeric" maxLength={3} disabled={!!form.dateOfBirth}
                value={form.dateOfBirth ? (member?.age ?? "") : form.age ?? ""} onChange={(e) => set("age", num(e.target.value.replace(/\D/g, "")))}
                {...aria("age")} className={`${cls("age")} disabled:bg-brand-tint disabled:text-muted`} />
              {err("age")}
            </div>
          </div>
          <div>
            <p className="mb-1.5 font-semibold text-ink" id="m-gender-label">{t.profile.gender}<span className="font-normal text-muted"> {t.profile.optional}</span></p>
            <div role="radiogroup" aria-labelledby="m-gender-label" className="flex flex-wrap gap-2">
              {(["FEMALE", "MALE", "OTHER"] as Gender[]).map((g) => (
                <button key={g} type="button" role="radio" aria-checked={form.gender === g} onClick={() => set("gender", form.gender === g ? null : g)}
                  className={`min-h-[44px] rounded-full border-[1.5px] px-4 font-semibold ${form.gender === g ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand"}`}>
                  {t.book.genders[g]}
                </button>
              ))}
            </div>
          </div>
          {!isSelf && (
            <div>
              {label("m-phone", t.profile.phone)}
              <div className={`flex overflow-hidden rounded-xl border-[1.5px] focus-within:border-brand ${errors.phone ? "border-danger" : "border-line"}`}>
                <span className="flex items-center border-r border-line bg-brand-tint px-3 font-semibold text-muted">+91</span>
                <input id="m-phone" inputMode="numeric" maxLength={10} value={text("phone")} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10) || null)}
                  {...aria("phone")} className="min-w-0 flex-1 bg-white px-3.5 py-3 text-base focus:outline-none" />
              </div>
              {errors.phone ? err("phone") : <p className="mt-1.5 text-sm text-muted">{t.profile.phoneHint}</p>}
            </div>
          )}
        </Section>

        <Section title={t.profile.sections.health}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              {label("m-blood", t.profile.bloodGroup)}
              <select id="m-blood" value={text("bloodGroup")} onChange={(e) => set("bloodGroup", e.target.value || null)} className={`${cls()} min-h-[50px] px-2`}>
                <option value="">{t.profile.notSure}</option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              {label("m-heightCm", t.profile.height)}
              <input id="m-heightCm" inputMode="decimal" maxLength={5} value={form.heightCm ?? ""} onChange={(e) => set("heightCm", num(e.target.value.replace(/[^\d.]/g, "")))}
                {...aria("heightCm")} className={cls("heightCm")} />
              {err("heightCm")}
            </div>
            <div>
              {label("m-weightKg", t.profile.weight)}
              <input id="m-weightKg" inputMode="decimal" maxLength={5} value={form.weightKg ?? ""} onChange={(e) => set("weightKg", num(e.target.value.replace(/[^\d.]/g, "")))}
                {...aria("weightKg")} className={cls("weightKg")} />
              {err("weightKg")}
            </div>
          </div>
          <TextArea id="m-allergies" label={t.profile.allergies} hint={t.profile.allergiesHint} value={text("allergies")} onChange={(v) => set("allergies", v || null)} optional={t.profile.optional} />
        </Section>

        <Section title={t.profile.sections.history} note={t.profile.historyNote}>
          <TextArea id="m-conditions" label={t.profile.conditions} hint={t.profile.conditionsHint} value={text("conditions")} onChange={(v) => set("conditions", v || null)} optional={t.profile.optional} />
          <TextArea id="m-surgeries" label={t.profile.surgeries} hint={t.profile.surgeriesHint} value={text("surgeries")} onChange={(v) => set("surgeries", v || null)} optional={t.profile.optional} />
          <TextArea id="m-medicines" label={t.profile.medicines} hint={t.profile.medicinesHint} value={text("medicines")} onChange={(v) => set("medicines", v || null)} optional={t.profile.optional} />
        </Section>

        <Section title={t.profile.sections.emergency}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              {label("m-emName", t.profile.emergencyName)}
              <input id="m-emName" value={text("emergencyName")} maxLength={100} onChange={(e) => set("emergencyName", e.target.value || null)} className={cls()} />
            </div>
            <div>
              {label("m-emRelation", t.profile.emergencyRelation)}
              <input id="m-emRelation" value={text("emergencyRelation")} maxLength={40} onChange={(e) => set("emergencyRelation", e.target.value || null)} className={cls()} />
            </div>
          </div>
          <div>
            {label("m-emergencyPhone", t.profile.emergencyPhone)}
            <div className={`flex overflow-hidden rounded-xl border-[1.5px] focus-within:border-brand ${errors.emergencyPhone ? "border-danger" : "border-line"}`}>
              <span className="flex items-center border-r border-line bg-brand-tint px-3 font-semibold text-muted">+91</span>
              <input id="m-emergencyPhone" inputMode="numeric" maxLength={10} value={text("emergencyPhone")}
                onChange={(e) => set("emergencyPhone", e.target.value.replace(/\D/g, "").slice(0, 10) || null)}
                {...aria("emergencyPhone")} className="min-w-0 flex-1 bg-white px-3.5 py-3 text-base focus:outline-none" />
            </div>
            {err("emergencyPhone")}
          </div>
        </Section>

        <Section title={t.profile.sections.address}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              {label("m-area", t.profile.area)}
              <input id="m-area" value={text("addressArea")} maxLength={100} onChange={(e) => set("addressArea", e.target.value || null)} className={cls()} />
            </div>
            <div>
              {label("m-city", t.profile.city)}
              <input id="m-city" value={text("addressCity")} maxLength={60} onChange={(e) => set("addressCity", e.target.value || null)} className={cls()} />
            </div>
          </div>
        </Section>

        <Section title={t.profile.sections.sharing}>
          <label className="flex cursor-pointer items-start gap-3 text-[15px] text-ink">
            <input type="checkbox" checked={!!form.recordsConsent} onChange={(e) => set("recordsConsent", e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
            <span>{t.profile.share}<span className="mt-1 block text-sm text-muted">{t.profile.shareHint}</span></span>
          </label>
        </Section>

        {serverError && <p role="alert" className="rounded-xl bg-danger-light px-4 py-3 font-medium text-danger">{serverError}</p>}
        <div className="sticky bottom-[84px] z-10 flex flex-col gap-2 rounded-[22px] bg-white/95 py-2 backdrop-blur md:static md:bg-transparent">
          {saved && <p role="status" className="text-center font-semibold text-brand-dark">{t.profile.saved}</p>}
          <button type="submit" disabled={busy} className={`${primary} min-h-[52px] text-[17px] shadow-soft`}>{busy ? t.profile.saving : isNew ? t.profile.add : t.profile.save}</button>
        </div>
      </form>

      {!isNew && !isSelf && (
        <>
          <button type="button" onClick={() => removeDialog.current?.showModal()} className="mx-auto min-h-[44px] px-4 font-semibold text-danger underline underline-offset-4">
            {t.profile.remove(form.name)}
          </button>
          <dialog ref={removeDialog} aria-labelledby="rm-title" onClick={(e) => e.target === removeDialog.current && removeDialog.current?.close()}
            className="m-auto w-[calc(100%-24px)] max-w-sm rounded-[22px] border border-line p-6 text-ink shadow-soft backdrop:bg-ink/50">
            <h2 id="rm-title" className="text-lg font-bold">{t.profile.removeTitle(form.name)}</h2>
            <p className="mt-2 text-[15px] text-muted">{t.profile.removeText}</p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button type="button" onClick={remove} disabled={busy} className="min-h-[48px] rounded-full bg-danger px-5 font-semibold text-white disabled:opacity-60">{t.profile.removeYes}</button>
              <button type="button" onClick={() => removeDialog.current?.close()} className="min-h-[48px] rounded-full border-[1.5px] border-line px-5 font-semibold">{t.profile.keep}</button>
            </div>
          </dialog>
        </>
      )}
    </Page>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-[22px] border border-line bg-white p-4 sm:p-5">
      <legend className="px-1 text-lg font-bold text-ink">{title}</legend>
      {note && <p className="-mt-2 text-sm text-muted">{note}</p>}
      {children}
    </fieldset>
  );
}

function TextArea({ id, label, hint, value, onChange, optional }: { id: string; label: string; hint: string; value: string; onChange: (v: string) => void; optional: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-semibold text-ink">{label}<span className="font-normal text-muted"> {optional}</span></label>
      <textarea id={id} rows={2} maxLength={1000} value={value} placeholder={hint} onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-xl border-[1.5px] border-line bg-white px-3.5 py-3 text-base text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none" />
    </div>
  );
}
