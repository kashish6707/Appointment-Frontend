"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import Logo from "@/components/ui/Logo";
import { Card, ErrorBox, pill, Skeleton } from "@/components/dashboard/ui";
import { ApiError } from "@/lib/api";
import { addClinicPhoto, clinicDetailsKey, fetcher, removeClinicPhoto, setClinicCover, type ClinicDetails } from "@/lib/doctorApi";
import { clinicPhoto, PhotoError } from "@/lib/photo";
import { t } from "@/lib/strings";
import LogoutButton from "../dashboard/LogoutButton";

type ClinicRef = { id: string; name: string; area: string };

export default function ClinicPhotos({ clinics }: { clinics: ClinicRef[] }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[960px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo size={36} />
          <div className="flex items-center gap-3">
            <Link href="/doctor/dashboard" className="rounded-full px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light">← {t.clinicPhotos.back}</Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-[960px] flex-col gap-6 px-4 pb-16 pt-8 sm:px-6">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-brand-dark sm:text-[34px]">{t.clinicPhotos.pageTitle}</h1>
          <p className="mt-2 text-muted">{t.clinicPhotos.pageIntro}</p>
        </div>
        {clinics.length === 0 ? <ErrorBox message={t.clinicPhotos.noClinics} /> : clinics.map((c) => <ClinicCard key={c.id} clinic={c} />)}
      </main>
    </div>
  );
}

function ClinicCard({ clinic }: { clinic: ClinicRef }) {
  const { data, error, mutate } = useSWR<ClinicDetails>(clinicDetailsKey(clinic.id), fetcher, { revalidateOnFocus: false });
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function run(action: () => Promise<ClinicDetails>) {
    setBusy(true);
    setProblem("");
    try {
      await mutate(await action(), { revalidate: false });
    } catch (e) {
      setProblem(e instanceof ApiError ? e.message : t.profile.photoErrors.unreadable);
    } finally {
      setBusy(false);
    }
  }

  async function addFiles(files: FileList | null) {
    if (!files?.length || !data) return;
    setBusy(true);
    setProblem("");
    let latest = data;
    try {
      for (const file of Array.from(files).slice(0, data.maxPhotos - data.photos.length)) {
        latest = await addClinicPhoto(clinic.id, await clinicPhoto(file));
        await mutate(latest, { revalidate: false });
      }
    } catch (e) {
      setProblem(
        e instanceof PhotoError ? t.profile.photoErrors[e.message] ?? t.profile.photoErrors.unreadable
          : e instanceof ApiError ? e.message : t.profile.photoErrors.unreadable,
      );
    } finally {
      setBusy(false);
    }
  }

  const full = !!data && data.photos.length >= data.maxPhotos;
  return (
    <Card
      title={<span>{clinic.name}<span className="font-normal text-muted"> · {clinic.area}</span></span>}
      action={data ? <span className="text-sm text-muted">{t.clinicPhotos.count(data.photos.length, data.maxPhotos)}</span> : null}
    >
      {error ? (
        <ErrorBox message={error.message} onRetry={() => mutate()} />
      ) : !data ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <div className="flex flex-col gap-4">
          {data.photos.length === 0 ? (
            <p className="rounded-xl border-[1.5px] border-dashed border-line px-4 py-8 text-center text-muted">{t.clinicPhotos.empty}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.photos.map((p, i) => {
                const isCover = p.id === data.coverPhotoId;
                return (
                  <li key={p.id} className={`overflow-hidden rounded-xl border-[1.5px] ${isCover ? "border-brand" : "border-line"}`}>
                    <div className="relative aspect-[4/3] bg-brand-tint">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.small} alt={t.clinicPhotos.alt(data.name, i + 1)} className="h-full w-full object-cover" loading="lazy" />
                      {isCover && <span className="absolute left-2 top-2 rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">{t.clinicPhotos.cover}</span>}
                    </div>
                    {confirming === p.id ? (
                      <div className="flex flex-wrap items-center gap-2 p-2">
                        <span className="text-sm text-ink">{t.clinicPhotos.confirmRemove}</span>
                        <button type="button" disabled={busy} onClick={() => { setConfirming(null); run(() => removeClinicPhoto(clinic.id, p.id)); }}
                          className="rounded-full bg-danger px-3 py-1 text-sm font-semibold text-white">{t.clinicPhotos.yesRemove}</button>
                        <button type="button" onClick={() => setConfirming(null)} className="rounded-full px-3 py-1 text-sm font-semibold text-brand hover:bg-brand-light">{t.clinicPhotos.cancel}</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 p-2">
                        {!isCover ? (
                          <button type="button" disabled={busy} onClick={() => run(() => setClinicCover(clinic.id, p.id))}
                            className="rounded-full px-3 py-1 text-sm font-semibold text-brand hover:bg-brand-light">{t.clinicPhotos.makeCover}</button>
                        ) : <span />}
                        <button type="button" disabled={busy} onClick={() => setConfirming(p.id)}
                          className="rounded-full px-3 py-1 text-sm font-semibold text-danger hover:bg-danger-light">{t.clinicPhotos.remove}</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {problem && <p role="alert" className="text-sm font-medium text-danger">{problem}</p>}
          {full ? (
            <p className="text-sm text-muted">{t.clinicPhotos.full(data.maxPhotos)}</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className={`${pill.primary} self-start`}>
                {busy ? t.clinicPhotos.adding : t.clinicPhotos.add}
              </button>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
                onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              <p className="text-sm text-muted">{t.clinicPhotos.hint(data.maxPhotos)}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
