"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { addRecord, deleteRecord, listRecords, type RecordItem } from "@/lib/patientAccount";
import { PhotoError, recordFile } from "@/lib/photo";
import { longDate, todayIST } from "@/lib/time";
import { useAccount } from "./AccountProvider";
import { FolderIcon } from "./icons";
import PatientHeader from "./PatientHeader";
import { SignedOut } from "./ProfileScreens";

const field = "w-full rounded-xl border-[1.5px] bg-white px-3.5 py-3 text-base text-ink focus:border-brand focus:outline-none";

/** Prescriptions and test reports for each person in the account. */
export default function RecordsScreen() {
  const { t } = useLang();
  const { me, refresh } = useAccount();
  const [memberId, setMemberId] = useState<string>("");
  const [records, setRecords] = useState<RecordItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<RecordItem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (me && !memberId) setMemberId(me.members[0]?.id ?? "");
  }, [me, memberId]);

  const load = useCallback(async () => {
    if (!memberId) return;
    setLoadError(false);
    try {
      setRecords((await listRecords(memberId)).records);
    } catch {
      setLoadError(true);
    }
  }, [memberId]);

  useEffect(() => {
    setRecords(null);
    load();
  }, [load]);

  useEffect(() => {
    if (deleting) dialog.current?.showModal();
    else dialog.current?.close();
  }, [deleting]);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteRecord(deleting.id);
      setRecords((r) => r?.filter((x) => x.id !== deleting.id) ?? null);
      refresh();
    } finally {
      setDeleting(null);
    }
  }

  let body;
  if (me === undefined) body = <div className="h-60 animate-pulse rounded-[22px] bg-brand-tint motion-reduce:animate-none" />;
  else if (me === null) body = <SignedOut text={t.records.signedOut} next="/records" />;
  else {
    const member = me.members.find((m) => m.id === memberId);
    body = (
      <>
        {me.members.length > 1 && (
          <div role="tablist" aria-label={t.records.whose} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {me.members.map((m) => (
              <button key={m.id} type="button" role="tab" aria-selected={memberId === m.id} onClick={() => { setMemberId(m.id); setAdding(false); }}
                className={`min-h-[44px] shrink-0 rounded-full border-[1.5px] px-4 font-semibold ${memberId === m.id ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"}`}>
                {m.relation === "SELF" ? t.records.you : m.name}
              </button>
            ))}
          </div>
        )}

        {adding ? (
          <UploadForm memberId={memberId} onDone={(r) => { setAdding(false); if (r) { setRecords((cur) => [r, ...(cur ?? [])]); refresh(); } }} />
        ) : (
          <button type="button" onClick={() => setAdding(true)}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-brand px-6 text-[17px] font-semibold text-white shadow-soft hover:bg-brand-dark">
            + {t.records.add}
          </button>
        )}

        {member && !member.recordsConsent && (
          <p className="rounded-2xl bg-brand-tint px-4 py-3 text-[15px] text-ink">{t.records.notShared}</p>
        )}

        {loadError ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border-[1.5px] border-danger bg-danger-light px-4 py-3">
            <p className="font-medium text-danger">{t.common.loadError}</p>
            <button type="button" onClick={load} className="min-h-[44px] rounded-full border-[1.5px] border-danger bg-white px-4 font-semibold text-danger">{t.common.retry}</button>
          </div>
        ) : records === null ? (
          <div className="h-40 animate-pulse rounded-[22px] bg-brand-tint motion-reduce:animate-none" />
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[22px] bg-brand-tint px-5 py-10 text-center text-muted">
            <FolderIcon size={32} />
            <p className="text-[16px]">{t.records.empty}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {records.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-[20px] border border-line bg-white p-3.5 sm:p-4">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${r.kind === "PRESCRIPTION" ? "bg-brand-light text-brand-dark" : "bg-[#EAF1FB] text-[#1D4E89]"}`}>
                  {r.contentType === "application/pdf" ? "PDF" : t.records.photo}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{r.title}</p>
                  <p className="text-sm text-muted">
                    {t.records.kinds[r.kind]} · {longDate(r.date)}{r.addedBy === "CLINIC" ? ` · ${t.records.byClinic}` : ""}
                  </p>
                </div>
                <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" aria-label={t.records.viewNamed(r.title)}
                  className="inline-flex min-h-[44px] items-center rounded-full border-[1.5px] border-brand px-4 font-semibold text-brand hover:bg-brand-light">
                  {t.records.view}
                </a>
                {r.addedBy === "PATIENT" && (
                  <button type="button" onClick={() => setDeleting(r)} aria-label={t.records.deleteNamed(r.title)}
                    className="min-h-[44px] px-2 text-sm font-semibold text-danger underline underline-offset-4">
                    {t.records.delete}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-center text-sm text-muted">{t.records.privacy}</p>
      </>
    );
  }

  return (
    <>
      <PatientHeader />
      <main className="mx-auto flex max-w-[680px] flex-col gap-4 px-4 pb-10 pt-4 sm:pt-8">
        <h1 className="text-[24px] font-bold text-ink">{t.records.title}</h1>
        {body}
      </main>
      <dialog ref={dialog} aria-labelledby="del-title" onClose={() => setDeleting(null)}
        onClick={(e) => e.target === dialog.current && setDeleting(null)}
        className="m-auto w-[calc(100%-24px)] max-w-sm rounded-[22px] border border-line p-6 text-ink shadow-soft backdrop:bg-ink/50">
        <h2 id="del-title" className="text-lg font-bold">{t.records.deleteConfirm(deleting?.title ?? "")}</h2>
        <div className="mt-5 flex flex-col gap-2.5">
          <button type="button" onClick={confirmDelete} className="min-h-[48px] rounded-full bg-danger px-5 font-semibold text-white">{t.records.deleteYes}</button>
          <button type="button" onClick={() => setDeleting(null)} className="min-h-[48px] rounded-full border-[1.5px] border-line px-5 font-semibold">{t.records.keep}</button>
        </div>
      </dialog>
    </>
  );
}

function UploadForm({ memberId, onDone }: { memberId: string; onDone: (r: RecordItem | null) => void }) {
  const { t } = useLang();
  const [kind, setKind] = useState<RecordItem["kind"]>("PRESCRIPTION");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayIST());
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ title?: string; file?: string; date?: string }>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: typeof errors = {};
    if (title.trim().length < 2) e.title = t.records.errors.title;
    if (!date || date > todayIST()) e.date = t.records.errors.date;
    if (!file) e.file = t.records.errors.file;
    setErrors(e);
    setServerError("");
    const first = (["title", "date", "file"] as const).find((k) => e[k]);
    if (first) return document.getElementById(`rec-${first}`)?.focus();
    setBusy(true);
    try {
      const data = await recordFile(file!);
      onDone(await addRecord(memberId, { kind, title: title.trim(), date, file: data }));
    } catch (err) {
      if (err instanceof PhotoError) setErrors({ file: err.message === "too-big" ? t.records.errors.tooBig : t.records.errors.file });
      else setServerError(err instanceof ApiError ? err.message : t.common.loadError);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-[22px] border-[1.5px] border-brand bg-white p-4 sm:p-5">
      <h2 className="text-lg font-bold text-ink">{t.records.add}</h2>
      <div role="radiogroup" aria-label={t.records.kind} className="flex gap-2">
        {(["PRESCRIPTION", "REPORT"] as const).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
            className={`min-h-[44px] rounded-full border-[1.5px] px-4 font-semibold ${kind === k ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand"}`}>
            {t.records.kinds[k]}
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="rec-title" className="mb-1.5 block font-semibold">{t.records.titleLabel}</label>
        <input id="rec-title" value={title} maxLength={120} placeholder={kind === "PRESCRIPTION" ? t.records.titleHintRx : t.records.titleHintReport}
          onChange={(e) => setTitle(e.target.value)} aria-invalid={errors.title ? true : undefined} aria-describedby={errors.title ? "rec-title-error" : undefined}
          className={`${field} ${errors.title ? "border-danger" : "border-line"}`} />
        {errors.title && <p id="rec-title-error" className="mt-1.5 text-sm font-medium text-danger">{errors.title}</p>}
      </div>
      <div>
        <label htmlFor="rec-date" className="mb-1.5 block font-semibold">{t.records.date}</label>
        <input id="rec-date" type="date" value={date} max={todayIST()} onChange={(e) => setDate(e.target.value)}
          aria-invalid={errors.date ? true : undefined} aria-describedby={errors.date ? "rec-date-error" : undefined}
          className={`${field} min-h-[50px] ${errors.date ? "border-danger" : "border-line"}`} />
        {errors.date && <p id="rec-date-error" className="mt-1.5 text-sm font-medium text-danger">{errors.date}</p>}
      </div>
      <div>
        <label htmlFor="rec-file" className="mb-1.5 block font-semibold">{t.records.file}</label>
        <input id="rec-file" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          aria-invalid={errors.file ? true : undefined} aria-describedby={errors.file ? "rec-file-error" : "rec-file-hint"}
          className="block w-full text-[15px] text-ink file:mr-3 file:min-h-[44px] file:rounded-full file:border-0 file:bg-brand-light file:px-4 file:font-semibold file:text-brand-dark" />
        {errors.file ? <p id="rec-file-error" className="mt-1.5 text-sm font-medium text-danger">{errors.file}</p>
          : <p id="rec-file-hint" className="mt-1.5 text-sm text-muted">{t.records.fileHint}</p>}
      </div>
      {serverError && <p role="alert" className="rounded-xl bg-danger-light px-4 py-3 font-medium text-danger">{serverError}</p>}
      <div className="flex flex-wrap gap-2.5">
        <button type="submit" disabled={busy} className="min-h-[48px] flex-1 rounded-full bg-brand px-6 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy ? t.records.uploading : t.records.upload}
        </button>
        <button type="button" onClick={() => onDone(null)} className="min-h-[48px] rounded-full border-[1.5px] border-line px-5 font-semibold">{t.records.cancel}</button>
      </div>
    </form>
  );
}
