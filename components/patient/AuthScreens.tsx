"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { forgotPassword, register, resetPassword, signIn } from "@/lib/patientAccount";
import { isEmail, isIndianMobile, isStrongPassword } from "@/lib/validation";
import { useAccount } from "./AccountProvider";
import PatientHeader from "./PatientHeader";

type Method = "phone" | "email";

const field = "w-full rounded-xl border-[1.5px] bg-white px-3.5 py-3 text-base text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none";

/** Where to go after signing in: ?next=/somewhere on this site, else the profile. */
function useNext() {
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/profile";
}

function Shell({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <>
      <PatientHeader />
      <main className="mx-auto flex max-w-[460px] flex-col gap-5 px-4 pb-10 pt-6 sm:pt-10">
        <div>
          <h1 className="text-[26px] font-bold leading-tight text-ink">{title}</h1>
          {text && <p className="mt-1.5 text-[16px] text-muted">{text}</p>}
        </div>
        {children}
      </main>
    </>
  );
}

function FieldError({ id, text }: { id: string; text?: string }) {
  return text ? <p id={id} className="mt-1.5 text-sm font-medium text-danger">{text}</p> : null;
}

function MethodSwitch({ method, onChange }: { method: Method; onChange: (m: Method) => void }) {
  const { t } = useLang();
  return (
    <div role="radiogroup" aria-label={t.auth.methodLabel} className="grid grid-cols-2 gap-1 rounded-full bg-brand-tint p-1">
      {(["phone", "email"] as const).map((m) => (
        <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => onChange(m)}
          className={`min-h-[44px] rounded-full font-semibold ${method === m ? "bg-white text-brand-dark shadow-soft" : "text-muted"}`}>
          {m === "phone" ? t.auth.usePhone : t.auth.useEmail}
        </button>
      ))}
    </div>
  );
}

function ContactField({ method, phone, email, setPhone, setEmail, error }: {
  method: Method; phone: string; email: string; setPhone: (v: string) => void; setEmail: (v: string) => void; error?: string;
}) {
  const { t } = useLang();
  const described = { "aria-invalid": error ? true : undefined, "aria-describedby": error ? "auth-contact-error" : undefined };
  return method === "phone" ? (
    <div>
      <label htmlFor="auth-contact" className="mb-1.5 block font-semibold">{t.auth.mobile}</label>
      <div className={`flex overflow-hidden rounded-xl border-[1.5px] focus-within:border-brand ${error ? "border-danger" : "border-line"}`}>
        <span className="flex items-center border-r border-line bg-brand-tint px-3 font-semibold text-muted">+91</span>
        <input id="auth-contact" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} {...described}
          className="min-w-0 flex-1 bg-white px-3.5 py-3 text-base focus:outline-none" />
      </div>
      <FieldError id="auth-contact-error" text={error} />
    </div>
  ) : (
    <div>
      <label htmlFor="auth-contact" className="mb-1.5 block font-semibold">{t.auth.email}</label>
      <input id="auth-contact" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} {...described}
        className={`${field} ${error ? "border-danger" : "border-line"}`} />
      <FieldError id="auth-contact-error" text={error} />
    </div>
  );
}

function PasswordField({ id, label, value, onChange, error, autoComplete, hint }: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete: string; hint?: string;
}) {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-semibold">{label}</label>
      <div className={`flex overflow-hidden rounded-xl border-[1.5px] bg-white focus-within:border-brand ${error ? "border-danger" : "border-line"}`}>
        <input id={id} type={show ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="min-w-0 flex-1 px-3.5 py-3 text-base focus:outline-none" />
        <button type="button" onClick={() => setShow((v) => !v)} aria-pressed={show} className="px-3.5 text-sm font-semibold text-brand">
          {show ? t.auth.hide : t.auth.show}
        </button>
      </div>
      {error ? <FieldError id={`${id}-error`} text={error} /> : hint && <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">{hint}</p>}
    </div>
  );
}

function ServerError({ text }: { text: string }) {
  return text ? <p role="alert" className="rounded-xl bg-danger-light px-4 py-3 font-medium text-danger">{text}</p> : null;
}

const submitClass = "min-h-[52px] rounded-full bg-brand px-6 text-[17px] font-semibold text-white shadow-soft hover:bg-brand-dark disabled:opacity-60";

export function SignInScreen() {
  const { t } = useLang();
  const router = useRouter();
  const next = useNext();
  const { setMe } = useAccount();
  const [method, setMethod] = useState<Method>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ contact?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: typeof errors = {};
    if (method === "phone" ? !isIndianMobile(phone) : !isEmail(email.trim())) e.contact = method === "phone" ? t.auth.errors.mobile : t.auth.errors.email;
    if (!password) e.password = t.auth.errors.passwordEmpty;
    setErrors(e);
    setServerError("");
    if (e.contact || e.password) return document.getElementById(e.contact ? "auth-contact" : "auth-password")?.focus();
    setBusy(true);
    try {
      const me = await signIn(method === "phone" ? { method, phone, password } : { method, email: email.trim(), password });
      setMe(me);
      router.push(next);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t.common.loadError);
      setBusy(false);
    }
  }

  return (
    <Shell title={t.auth.signInTitle} text={t.auth.signInText}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <MethodSwitch method={method} onChange={(m) => { setMethod(m); setErrors({}); }} />
        <ContactField method={method} phone={phone} email={email} setPhone={setPhone} setEmail={setEmail} error={errors.contact} />
        <PasswordField id="auth-password" label={t.auth.password} value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" />
        <Link href="/forgot-password" className="-mt-1 self-end text-[15px] font-semibold text-brand underline underline-offset-4">{t.auth.forgot}</Link>
        <ServerError text={serverError} />
        <button type="submit" disabled={busy} className={submitClass}>{busy ? t.auth.working : t.auth.signIn}</button>
      </form>
      <p className="text-center text-[15px] text-muted">
        {t.auth.noAccount} <Link href={`/register${next !== "/profile" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand underline underline-offset-4">{t.auth.createOne}</Link>
      </p>
    </Shell>
  );
}

export function RegisterScreen() {
  const { t } = useLang();
  const router = useRouter();
  const next = useNext();
  const { setMe } = useAccount();
  const [method, setMethod] = useState<Method>("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ name?: string; contact?: string; password?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: typeof errors = {};
    if (name.trim().length < 3) e.name = t.auth.errors.name;
    if (method === "phone" ? !isIndianMobile(phone) : !isEmail(email.trim())) e.contact = method === "phone" ? t.auth.errors.mobile : t.auth.errors.email;
    if (!isStrongPassword(password)) e.password = t.auth.errors.password;
    if (!confirm || confirm !== password) e.confirm = t.auth.errors.confirm;
    setErrors(e);
    setServerError("");
    const first = (["name", "contact", "password", "confirm"] as const).find((k) => e[k]);
    if (first) return document.getElementById(`auth-${first}`)?.focus();
    setBusy(true);
    try {
      const contact = method === "phone" ? { method, phone } as const : { method, email: email.trim() } as const;
      const me = await register({ ...contact, fullName: name.trim(), password });
      setMe(me);
      // Straight to their own profile to add details, unless they came from somewhere (e.g. booking).
      router.push(next === "/profile" ? `/profile/${me.members[0].id}?welcome=1` : next);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t.common.loadError);
      setBusy(false);
    }
  }

  return (
    <Shell title={t.auth.registerTitle} text={t.auth.registerText}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div>
          <label htmlFor="auth-name" className="mb-1.5 block font-semibold">{t.auth.fullName}</label>
          <input id="auth-name" autoComplete="name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)}
            aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "auth-name-error" : undefined}
            className={`${field} ${errors.name ? "border-danger" : "border-line"}`} />
          <FieldError id="auth-name-error" text={errors.name} />
        </div>
        <MethodSwitch method={method} onChange={(m) => { setMethod(m); setErrors({}); }} />
        <ContactField method={method} phone={phone} email={email} setPhone={setPhone} setEmail={setEmail} error={errors.contact} />
        {method === "phone" && <p className="-mt-2 text-sm text-muted">{t.auth.phoneResetNote}</p>}
        <PasswordField id="auth-password" label={t.auth.newPassword} value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" hint={t.auth.passwordRules} />
        <PasswordField id="auth-confirm" label={t.auth.confirm} value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
        <p className="text-sm text-muted">{t.auth.privacy}</p>
        <ServerError text={serverError} />
        <button type="submit" disabled={busy} className={submitClass}>{busy ? t.auth.working : t.auth.createAccount}</button>
      </form>
      <p className="text-center text-[15px] text-muted">
        {t.auth.haveAccount} <Link href={`/login${next !== "/profile" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand underline underline-offset-4">{t.auth.signIn}</Link>
      </p>
    </Shell>
  );
}

export function ForgotScreen() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!isEmail(email.trim())) {
      setError(t.auth.errors.email);
      return document.getElementById("auth-contact")?.focus();
    }
    setError("");
    setServerError("");
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      setSent(t.auth.forgotSent);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t.common.loadError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={t.auth.forgotTitle} text={t.auth.forgotText}>
      {sent ? (
        <p role="status" className="rounded-2xl bg-brand-light px-4 py-4 font-semibold text-brand-dark">{sent}</p>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <ContactField method="email" phone="" email={email} setPhone={() => {}} setEmail={setEmail} error={error} />
          <ServerError text={serverError} />
          <button type="submit" disabled={busy} className={submitClass}>{busy ? t.auth.working : t.auth.sendLink}</button>
        </form>
      )}
      <p className="rounded-2xl bg-brand-tint px-4 py-3 text-[15px] text-ink">{t.auth.forgotPhoneNote}</p>
      <Link href="/login" className="text-center font-semibold text-brand underline underline-offset-4">{t.auth.backToSignIn}</Link>
    </Shell>
  );
}

export function ResetScreen() {
  const { t } = useLang();
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const { setMe } = useAccount();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: typeof errors = {};
    if (!isStrongPassword(password)) e.password = t.auth.errors.password;
    if (!confirm || confirm !== password) e.confirm = t.auth.errors.confirm;
    setErrors(e);
    setServerError("");
    if (e.password || e.confirm) return document.getElementById(e.password ? "auth-password" : "auth-confirm")?.focus();
    setBusy(true);
    try {
      setMe(await resetPassword(token, password));
      router.push("/profile");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t.common.loadError);
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <Shell title={t.auth.resetTitle}>
        <ServerError text={t.auth.resetBadLink} />
        <Link href="/forgot-password" className="font-semibold text-brand underline underline-offset-4">{t.auth.sendLink}</Link>
      </Shell>
    );
  }
  return (
    <Shell title={t.auth.resetTitle} text={t.auth.resetText}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <PasswordField id="auth-password" label={t.auth.newPassword} value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" hint={t.auth.passwordRules} />
        <PasswordField id="auth-confirm" label={t.auth.confirm} value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
        <ServerError text={serverError} />
        <button type="submit" disabled={busy} className={submitClass}>{busy ? t.auth.working : t.auth.resetSubmit}</button>
      </form>
    </Shell>
  );
}
