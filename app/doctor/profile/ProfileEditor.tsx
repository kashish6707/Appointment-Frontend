"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Logo from "@/components/Logo";
import TextField from "@/components/TextField";
import ProfileFields, { draftFromProfile, toInput, validateDraft, type ProfileDraft, type ProfileErrors } from "@/components/ProfileFields";
import { ApiError } from "@/lib/api";
import { fetcher, keys, updateProfile, type OwnProfile } from "@/lib/doctorApi";
import { t } from "@/lib/strings";
import { Card, ErrorBox, pill, Skeleton, Toasts, type Toast } from "@/components/dashboard/ui";
import LogoutButton from "../dashboard/LogoutButton";

export default function ProfileEditor() {
  const { data, error, mutate } = useSWR<OwnProfile>(keys.profile, fetcher, { revalidateOnFocus: false });
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[860px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo size={36} />
          <div className="flex items-center gap-3">
            <Link href="/doctor/dashboard" className="rounded-full px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light">← {t.schedule.back}</Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-[860px] flex-col gap-6 px-4 pb-16 pt-8 sm:px-6">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-brand-dark sm:text-[34px]">{t.profile.pageTitle}</h1>
          <p className="mt-2 text-muted">{t.profile.pageIntro}</p>
        </div>
        {error ? (
          <ErrorBox message={error.message} onRetry={() => mutate()} />
        ) : !data ? (
          <Skeleton className="h-[600px] rounded-[20px]" />
        ) : (
          <Form key={data.photoUrl ?? "none"} profile={data} onSaved={(p) => mutate(p, { revalidate: false })} />
        )}
      </main>
    </div>
  );
}

function Form({ profile, onSaved }: { profile: OwnProfile; onSaved: (p: OwnProfile) => void }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.fullName);
  const [draft, setDraft] = useState<ProfileDraft>(() => draftFromProfile(profile));
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: ProfileErrors = validateDraft(draft, true);
    if (fullName.trim().length < 3) e["profile-name"] = "Enter your full name, for example Dr. Rajeev Anand.";
    setErrors(e);
    setServerError("");
    const first = Object.keys(e)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    setBusy(true);
    try {
      const saved = await updateProfile({ ...toInput(draft), fullName: fullName.trim() });
      onSaved(saved);
      router.refresh(); // the dashboard's "complete your profile" reminder and photo
      const id = Date.now();
      setToasts([{ id, text: t.profile.saved }]);
      setTimeout(() => setToasts([]), 4000);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t.common.loadError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <TextField id="profile-name" label={t.profile.name} value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors["profile-name"]} autoComplete="name" />
        <ProfileFields draft={draft} onChange={setDraft} errors={errors} />
        {serverError && <p role="alert" className="rounded-xl border-[1.5px] border-danger bg-danger-light px-4 py-3 font-medium text-danger">{serverError}</p>}
        <button type="submit" disabled={busy} className={`${pill.primary} self-start`}>{busy ? t.profile.saving : t.profile.save}</button>
      </form>
      <Toasts toasts={toasts} onDismiss={() => setToasts([])} />
    </Card>
  );
}
