"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Logo from "@/components/Logo";
import TextField from "@/components/TextField";
import { ApiError } from "@/lib/api";
import { acceptInvite, getInvite, type InviteDetails } from "@/lib/doctorApi";
import { t } from "@/lib/strings";
import { isStrongPassword } from "@/lib/validation";

/** A staff member opens the invite link the doctor sent them and sets their own password. */
export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loadError, setLoadError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getInvite(token).then(setInvite, (err) => setLoadError(err instanceof ApiError ? err.message : t.common.loadError));
  }, [token]);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: typeof errors = {};
    if (!isStrongPassword(password)) e.password = t.invite.weak;
    if (confirm !== password) e.confirm = t.invite.mismatch;
    setErrors(e);
    setServerError("");
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await acceptInvite(token, password);
      router.replace("/doctor/dashboard");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t.common.loadError);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-8 px-5 py-8 sm:py-12">
      <Logo />
      {loadError ? (
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">{t.invite.invalidTitle}</h1>
          <p className="mt-2 text-muted">{loadError}</p>
        </div>
      ) : !invite ? (
        <p className="text-muted">{t.invite.loading}</p>
      ) : (
        <>
          <div>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight">{t.invite.title(invite.fullName)}</h1>
            <p className="mt-2 text-muted">{t.invite.intro(invite.doctors.join(", "))}</p>
            <p className="mt-1 text-muted">{t.invite.signInWith(invite.phone ? `+91 ${invite.phone}` : (invite.email ?? ""))}</p>
          </div>
          <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            {/* Hidden username field so password managers save the right account. */}
            <input type="text" name="username" autoComplete="username" value={invite.phone ?? invite.email ?? ""} readOnly hidden />
            <TextField id="password" label={t.invite.password} type="password" autoComplete="new-password" value={password}
              onChange={(e) => setPassword(e.target.value)} error={errors.password} hint={t.invite.weak} />
            <TextField id="confirm" label={t.invite.confirm} type="password" autoComplete="new-password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
            {serverError && <p role="alert" className="rounded-xl border-[1.5px] border-danger bg-danger-light px-4 py-3 font-medium text-danger">{serverError}</p>}
            <Button type="submit" loading={busy}>{busy ? t.invite.submitting : t.invite.submit}</Button>
          </form>
        </>
      )}
    </main>
  );
}
