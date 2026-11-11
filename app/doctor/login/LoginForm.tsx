"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { isEmail, isIndianMobile } from "@/lib/validation";
import { ApiError, signIn } from "@/lib/api";

type Method = "phone" | "email";
type Errors = Partial<Record<"phone" | "email" | "password", string>>;

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): Errors {
    const e: Errors = {};
    if (method === "phone" && !isIndianMobile(phone)) e.phone = "Enter your 10-digit mobile number.";
    if (method === "email" && !isEmail(email.trim())) e.email = "Enter a valid email address, like name@example.com.";
    if (!password) e.password = "Enter your password.";
    return e;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setServerError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(Object.keys(e)[0])?.focus();
      return;
    }
    setLoading(true);
    try {
      await signIn({
        method,
        ...(method === "phone" ? { phone } : { email: email.trim().toLowerCase() }),
        password,
      });
      router.replace(next);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function switchMethod(m: Method) {
    setMethod(m);
    setErrors((e) => ({ ...e, phone: undefined, email: undefined }));
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <fieldset>
          <legend className="mb-1.5 font-semibold">Sign in with</legend>
          <div className="grid grid-cols-2 rounded-full bg-brand-tint p-1" role="radiogroup" aria-label="Sign in with">
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
            autoComplete="username"
            maxLength={10}
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            error={errors.phone}
          />
        ) : (
          <TextField
            id="email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
        )}

        <TextField
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
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

        {serverError && (
          <p role="alert" className="rounded-xl border-[1.5px] border-danger bg-danger-light px-4 py-3 font-medium text-danger">
            {serverError}
          </p>
        )}

        <Button type="submit" loading={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-muted">
        New to Clinically?{" "}
        <Link href="/doctor/register" className="font-semibold text-brand underline underline-offset-4">
          Create a doctor account
        </Link>
      </p>
    </>
  );
}
