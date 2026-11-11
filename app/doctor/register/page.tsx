"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { isEmail, isIndianMobile, isStrongPassword, passwordRules } from "@/lib/validation";
import { ApiError, registerDoctor } from "@/lib/api";
import ProfileFields, { emptyDraft, toInput, validateDraft, type ProfileDraft, type ProfileErrors } from "@/components/ProfileFields";
import { t } from "@/lib/strings";

type Method = "phone" | "email";
type Errors = Partial<Record<"fullName" | "phone" | "email" | "password" | "confirm" | "terms", string>>;

const BENEFITS = [
  { title: "See today’s bookings", text: "Know how many patients booked online and walked in." },
  { title: "Start OPD with one tap", text: "Patients get told the doctor has arrived, so they come on time." },
  { title: "Call the next patient", text: "Move the queue and mark patients sent for tests." },
];

export default function DoctorRegisterPage() {
  const [method, setMethod] = useState<Method>("phone");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  // Step 1: the account. Step 2: professional details. Nothing is created until step 2 is sent.
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft);
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});

  function validateAccount(): Errors {
    const e: Errors = {};
    if (fullName.trim().length < 3) e.fullName = "Enter your full name, for example Dr. Rajeev Anand.";
    if (method === "phone" && !isIndianMobile(phone)) e.phone = "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.";
    if (method === "email" && !isEmail(email.trim())) e.email = "Enter a valid email address, like name@example.com.";
    if (!isStrongPassword(password)) e.password = "Your password needs at least 8 characters, with a letter and a number.";
    if (confirm !== password || !confirm) e.confirm = "Both passwords must match.";
    return e;
  }

  function goToProfile(ev: FormEvent) {
    ev.preventDefault();
    const e = validateAccount();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(Object.keys(e)[0])?.focus();
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0 });
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setServerError("");
    const pe = validateDraft(draft, true);
    setProfileErrors(pe);
    const termsError = terms ? undefined : "Please accept the terms to create your account.";
    setErrors((e) => ({ ...e, terms: termsError }));
    const first = Object.keys(pe)[0] ?? (termsError ? "terms" : null);
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    setLoading(true);
    try {
      await registerDoctor({
        fullName: fullName.trim(),
        method,
        ...(method === "phone" ? { phone } : { email: email.trim().toLowerCase() }),
        password,
        profile: toInput(draft),
      });
      setDone(true);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function switchMethod(m: Method) {
    setMethod(m);
    setErrors((e) => ({ ...e, phone: undefined, email: undefined }));
  }

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel: shown beside the form on large screens */}
      <aside className="hidden bg-brand-tint lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo size={48} />
        <div className="max-w-md">
          <h2 className="text-[34px] font-bold leading-tight tracking-tight text-brand-dark">
            Your clinic’s queue, on your phone
          </h2>
          <ul className="mt-8 space-y-6">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex gap-4">
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-soft" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                <span>
                  <span className="block font-semibold text-ink">{b.title}</span>
                  <span className="block text-muted">{b.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-muted">Clinically only manages bookings and queues. It never stores diagnoses or prescriptions.</p>
      </aside>

      <main className="mx-auto w-full max-w-lg px-5 py-8 sm:py-12 lg:flex lg:flex-col lg:justify-center">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>

        {done ? (
          <section aria-live="polite" className="rounded-3xl border border-line bg-white p-7 shadow-soft">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-brand" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </span>
            <h1 className="mt-5 text-2xl font-bold">Account created</h1>
            <p className="mt-2 text-muted">
              Welcome, {fullName.trim()}. Next, sign in to add your clinic and OPD timings. We’ll check your registration
              details before your profile is shown to patients.
            </p>
            <Link
              href="/doctor/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3.5 text-[17px] font-semibold text-white hover:bg-brand-dark"
            >
              Sign in
            </Link>
          </section>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand">{t.profile.step(step, 2)}</p>
            {step === 2 ? (
              <>
                <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight">{t.profile.stepProfile}</h1>
                <p className="mt-2 text-muted">{t.profile.profileIntro}</p>
                <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
                  <ProfileFields draft={draft} onChange={setDraft} errors={profileErrors} />
                  <TermsBox terms={terms} setTerms={setTerms} error={errors.terms} />
                  {serverError && (
                    <p role="alert" className="rounded-xl border-[1.5px] border-danger bg-danger-light px-4 py-3 font-medium text-danger">
                      {serverError}
                    </p>
                  )}
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button type="button" variant="ghost" onClick={() => { setStep(1); setServerError(""); }} className="sm:w-auto">
                      {t.profile.back}
                    </Button>
                    <Button type="submit" loading={loading}>{loading ? t.profile.creating : t.profile.create}</Button>
                  </div>
                </form>
              </>
            ) : (
            <>
            <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight">Create your doctor account</h1>
            <p className="mt-2 text-muted">Use your mobile number or email. Next, you’ll add your professional details.</p>

            <form onSubmit={goToProfile} noValidate className="mt-8 space-y-5">
              <TextField
                id="fullName"
                label="Full name"
                placeholder="Dr. Rajeev Anand"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
              />

              <fieldset>
                <legend className="mb-1.5 font-semibold">Sign up with</legend>
                <div className="grid grid-cols-2 rounded-full bg-brand-tint p-1" role="radiogroup" aria-label="Sign up with">
                  {(["phone", "email"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={method === m}
                      onClick={() => switchMethod(m)}
                      className={`rounded-full py-2.5 font-semibold transition-colors ${
                        method === m ? "bg-white text-brand-dark shadow-soft" : "text-muted hover:text-ink"
                      }`}
                    >
                      {m === "phone" ? "Mobile number" : "Email"}
                    </button>
                  ))}
                </div>
              </fieldset>

              {method === "phone" ? (
                <TextField
                  id="phone"
                  label="Mobile number"
                  prefix="+91"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  error={errors.phone}
                  hint="You’ll use this number to sign in."
                />
              ) : (
                <TextField
                  id="email"
                  label="Email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  hint="You’ll use this email to sign in."
                />
              )}

              <div>
                <TextField
                  id="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="px-3.5 text-sm font-semibold text-brand"
                      aria-pressed={showPassword}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  }
                />
                <ul className="mt-2 space-y-1" aria-label="Password requirements">
                  {passwordRules.map((r) => {
                    const ok = r.test(password);
                    return (
                      <li key={r.id} className={`flex items-center gap-2 text-sm ${ok ? "text-brand-dark" : "text-muted"}`}>
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full ${ok ? "bg-brand text-white" : "border border-line"}`}
                          aria-hidden="true"
                        >
                          {ok && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12l5 5L20 7" />
                            </svg>
                          )}
                        </span>
                        {r.label}
                        <span className="sr-only">{ok ? "(done)" : "(not yet)"}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <TextField
                id="confirm"
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={errors.confirm}
              />

              <Button type="submit">{t.profile.continue}</Button>
            </form>

            <p className="mt-6 text-center text-muted">
              Already registered?{" "}
              <Link href="/doctor/login" className="font-semibold text-brand underline underline-offset-4">
                Sign in
              </Link>
            </p>
            </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function TermsBox({ terms, setTerms, error }: { terms: boolean; setTerms: (v: boolean) => void; error?: string }) {
  return (
    <div>
      <label className="flex items-start gap-3">
        <input
          id="terms"
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-brand"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "terms-error" : undefined}
        />
        <span className="text-[15px] text-ink">
          I agree to the{" "}
          <a href="#" className="font-semibold text-brand underline underline-offset-4">Terms of use</a> and{" "}
          <a href="#" className="font-semibold text-brand underline underline-offset-4">Privacy policy</a>, and confirm I am a
          registered medical practitioner.
        </span>
      </label>
      {error && (
        <p id="terms-error" className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
