"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import useSWR, { SWRConfig } from "swr";
import Logo from "@/components/Logo";
import TextField from "@/components/TextField";
import { ApiError } from "@/lib/api";
import {
  addStaff,
  fetcher,
  keys,
  newInviteLink,
  removeStaff,
  updateStaff,
  type ActivityEntry,
  type DoctorProfile,
  type Permission,
  type StaffList,
  type StaffMember,
  type StaffRole,
} from "@/lib/doctorApi";
import { t } from "@/lib/strings";
import { clockTime, shortDate } from "@/lib/time";
import { isEmail, isIndianMobile } from "@/lib/validation";
import { Card, ConfirmDialog, ErrorBox, pill, Skeleton, Toasts, type Toast } from "@/components/dashboard/ui";
import LogoutButton from "../dashboard/LogoutButton";

export default function StaffManager({ doctor }: { doctor: DoctorProfile }) {
  return (
    <SWRConfig value={{ fetcher }}>
      <Inner doctor={doctor} />
    </SWRConfig>
  );
}

function Inner({ doctor }: { doctor: DoctorProfile }) {
  const { data, error, mutate } = useSWR<StaffList>(keys.staff);
  const activity = useSWR<{ entries: ActivityEntry[] }>(keys.activity());
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<StaffMember | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [invite, setInvite] = useState<{ name: string; url: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(text: string, tone: Toast["tone"] = "info") {
    const id = Date.now();
    setToasts((ts) => [...ts.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 5000);
  }
  const refresh = () => { mutate(); activity.mutate(); };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo size={36} />
          <div className="flex items-center gap-3">
            <Link href="/doctor/dashboard" className="rounded-full px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light">← {t.staff.back}</Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 pb-16 pt-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-brand-dark sm:text-[34px]">{t.staff.title}</h1>
            <p className="mt-2 text-muted">{t.staff.intro}</p>
          </div>
          {!adding && <button type="button" className={pill.primary} onClick={() => { setAdding(true); setInvite(null); setNotice(null); }}>{t.staff.add}</button>}
        </div>

        {invite && <InviteBox name={invite.name} url={invite.url} onClose={() => setInvite(null)} />}
        {notice && (
          <p role="status" className="rounded-[20px] border border-line bg-brand-tint px-5 py-4 text-ink">{notice}</p>
        )}

        {error ? (
          <ErrorBox message={error.message} onRetry={() => mutate()} />
        ) : !data ? (
          <Skeleton className="h-48 rounded-[20px]" />
        ) : (
          <>
            {adding && (
              <Card title={t.staff.add}>
                <StaffForm
                  doctor={doctor}
                  list={data}
                  onCancel={() => setAdding(false)}
                  onSubmit={async (input) => {
                    const r = await addStaff(input);
                    setAdding(false);
                    refresh();
                    if (r.inviteUrl) setInvite({ name: r.member.fullName, url: `${window.location.origin}${r.inviteUrl}` });
                    else setNotice(t.staff.existingAccount(r.member.fullName));
                  }}
                />
              </Card>
            )}

            {data.staff.length === 0 && !adding ? (
              <p className="rounded-[20px] bg-brand-tint px-5 py-8 text-center text-muted">{t.staff.empty}</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {data.staff.map((m) => (
                  <li key={m.id}>
                    <Card>
                      {editing === m.id ? (
                        <StaffForm
                          doctor={doctor}
                          list={data}
                          member={m}
                          onCancel={() => setEditing(null)}
                          onSubmit={async (input) => {
                            await updateStaff(m.id, { role: input.role, permissions: input.permissions, doctorClinicIds: input.doctorClinicIds });
                            setEditing(null);
                            refresh();
                            toast(t.staff.saved);
                          }}
                        />
                      ) : (
                        <MemberRow
                          member={m}
                          list={data}
                          clinicsTotal={doctor.clinics.length}
                          onEdit={() => { setEditing(m.id); setAdding(false); }}
                          onRemove={() => setRemoving(m)}
                          onNewLink={async () => {
                            try {
                              const r = await newInviteLink(m.id);
                              setInvite({ name: m.fullName, url: `${window.location.origin}${r.inviteUrl}` });
                              refresh();
                            } catch (err) {
                              toast(err instanceof ApiError ? err.message : t.common.loadError, "error");
                            }
                          }}
                        />
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <Card title={t.staff.activity}>
          {activity.error ? (
            <ErrorBox onRetry={() => activity.mutate()} />
          ) : !activity.data ? (
            <Skeleton className="h-24" />
          ) : activity.data.entries.length === 0 ? (
            <p className="text-muted">{t.staff.activityEmpty}</p>
          ) : (
            <ol className="flex flex-col divide-y divide-line">
              {activity.data.entries.map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
                  <span>
                    <span className="font-semibold">{e.actorName}</span>{" "}
                    <span className="text-ink">{t.activity[e.action] ?? e.action}</span>
                    {describe(e) && <span className="text-muted"> {describe(e)}</span>}
                  </span>
                  <span className="text-sm tabular-nums text-muted">{shortDate(e.at.slice(0, 10))}, {clockTime(e.at)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </main>

      <ConfirmDialog
        open={!!removing}
        title={removing ? t.staff.removeTitle(removing.fullName) : ""}
        text={t.staff.removeText}
        confirmLabel={t.staff.removeConfirm}
        busy={removeBusy}
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          if (!removing) return;
          setRemoveBusy(true);
          try {
            await removeStaff(removing.id);
            toast(t.staff.removed(removing.fullName));
            refresh();
          } catch (err) {
            toast(err instanceof ApiError ? err.message : t.common.loadError, "error");
          } finally {
            setRemoveBusy(false);
            setRemoving(null);
          }
        }}
      />
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((ts) => ts.filter((x) => x.id !== id))} />
    </div>
  );
}

/** Short extra detail for an activity entry, from fields the backend records. */
function describe(e: ActivityEntry): string {
  const d = (e.detail ?? {}) as Record<string, unknown>;
  if (typeof d.name === "string" && e.action.startsWith("staff.")) return String(d.name);
  if (typeof d.token === "number") return `(token ${d.token})`;
  return "";
}

function MemberRow({ member: m, list, clinicsTotal, onEdit, onRemove, onNewLink }: {
  member: StaffMember; list: StaffList; clinicsTotal: number; onEdit: () => void; onRemove: () => void; onNewLink: () => void;
}) {
  const statusStyle = m.status === "ACTIVE" ? "bg-brand-light text-brand-dark" : m.status === "INVITED" ? "bg-[#FDF6E7] text-[#5A4300]" : "bg-danger-light text-[#9A2E22]";
  const extras = m.permissions.filter((p) => p !== "queue.view");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold">{m.fullName}</p>
          <p className="text-muted">
            {t.roles[m.role]} · {m.phone ? `+91 ${m.phone}` : m.email} · {t.staff.clinicsCount(m.doctorClinicIds.length, clinicsTotal)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusStyle}`}>{t.staff.status[m.status]}</span>
      </div>
      <ul className="flex flex-wrap gap-2" aria-label={t.staff.permissions}>
        {extras.map((p) => (
          <li key={p} className="rounded-full border border-line px-3 py-1 text-sm text-ink">{list.permissions.find((x) => x.key === p) ? t.permissions[p] : p}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2.5">
        <button type="button" className={pill.outline} onClick={onEdit}>{t.staff.edit}</button>
        {m.status !== "ACTIVE" && <button type="button" className={pill.outline} onClick={onNewLink}>{t.staff.newLink}</button>}
        <button type="button" className={pill.danger} onClick={onRemove}>{t.staff.remove}</button>
      </div>
    </div>
  );
}

type FormInput = { fullName: string; phone?: string; email?: string; role: StaffRole; permissions: Permission[]; doctorClinicIds: string[] };

function StaffForm({ doctor, list, member, onCancel, onSubmit }: {
  doctor: DoctorProfile; list: StaffList; member?: StaffMember; onCancel: () => void; onSubmit: (input: FormInput) => Promise<void>;
}) {
  const editing = !!member;
  const [fullName, setFullName] = useState(member?.fullName ?? "");
  const [method, setMethod] = useState<"phone" | "email">(member?.email ? "email" : "phone");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [role, setRole] = useState<StaffRole>(member?.role ?? "COMPOUNDER");
  const [perms, setPerms] = useState<Set<Permission>>(new Set(member?.permissions ?? list.presets.COMPOUNDER));
  const [clinics, setClinics] = useState<Set<string>>(new Set(member?.doctorClinicIds ?? doctor.clinics.map((c) => c.doctorClinicId)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  function pickRole(r: StaffRole) {
    setRole(r);
    setPerms(new Set(list.presets[r])); // a role fills in its usual permissions
  }
  function toggle<T>(set: Set<T>, value: T, update: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    update(next);
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!editing) {
      if (fullName.trim().length < 3) e["staff-name"] = t.staff.errors.name;
      if (method === "phone" && !isIndianMobile(phone)) e["staff-phone"] = t.staff.errors.phone;
      if (method === "email" && !isEmail(email.trim())) e["staff-email"] = t.staff.errors.email;
    }
    if (clinics.size === 0) e["staff-clinics"] = t.staff.errors.clinics;
    setErrors(e);
    setServerError("");
    if (Object.keys(e).length) {
      document.getElementById(Object.keys(e)[0])?.focus();
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        ...(method === "phone" ? { phone } : { email: email.trim().toLowerCase() }),
        role,
        permissions: [...perms],
        doctorClinicIds: [...clinics],
      });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t.common.loadError);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {!editing && (
        <>
          <TextField id="staff-name" label={t.staff.name} value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors["staff-name"]} autoComplete="off" />
          <fieldset>
            <legend className="mb-1.5 font-semibold">{t.staff.contact}</legend>
            <div className="grid max-w-sm grid-cols-2 rounded-full bg-brand-tint p-1" role="radiogroup" aria-label={t.staff.contact}>
              {(["phone", "email"] as const).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => setMethod(m)}
                  className={`rounded-full py-2 font-semibold ${method === m ? "bg-white text-brand-dark shadow-soft" : "text-muted"}`}>
                  {m === "phone" ? t.staff.phone : t.staff.email}
                </button>
              ))}
            </div>
          </fieldset>
          {method === "phone" ? (
            <TextField id="staff-phone" label={t.staff.phone} prefix="+91" inputMode="numeric" maxLength={10} value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} error={errors["staff-phone"]} />
          ) : (
            <TextField id="staff-email" label={t.staff.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors["staff-email"]} />
          )}
        </>
      )}

      <fieldset>
        <legend className="mb-1 font-semibold">{t.staff.role}</legend>
        <p className="mb-2 text-sm text-muted">{t.staff.roleHint}</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(list.presets) as StaffRole[]).map((r) => (
            <label key={r} className={`flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] px-4 py-2 font-semibold ${role === r ? "border-brand bg-brand-light text-brand-dark" : "border-line"}`}>
              <input type="radio" name="staff-role" value={r} checked={role === r} onChange={() => pickRole(r)} className="accent-brand" />
              {t.roles[r]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-semibold">{t.staff.permissions}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {list.permissions.map(({ key }) => {
            const always = key === "queue.view";
            return (
              <label key={key} className={`flex items-start gap-3 rounded-2xl border border-line px-4 py-3 ${always ? "bg-brand-tint" : "cursor-pointer hover:border-brand"}`}>
                <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-brand" checked={always || perms.has(key)} disabled={always}
                  onChange={() => toggle(perms, key, setPerms)} />
                <span>
                  {t.permissions[key]}
                  {always && <span className="block text-sm text-muted">{t.staff.alwaysOn}</span>}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset aria-describedby={errors["staff-clinics"] ? "staff-clinics-error" : undefined}>
        <legend className="mb-2 font-semibold">{t.staff.clinics}</legend>
        <div className="flex flex-wrap gap-2" id="staff-clinics" tabIndex={-1}>
          {doctor.clinics.map((c) => (
            <label key={c.doctorClinicId} className={`flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] px-4 py-2 ${clinics.has(c.doctorClinicId) ? "border-brand bg-brand-light" : "border-line"}`}>
              <input type="checkbox" className="accent-brand" checked={clinics.has(c.doctorClinicId)} onChange={() => toggle(clinics, c.doctorClinicId, setClinics)} />
              <span className="font-semibold">{c.name}</span>
              <span className="text-sm text-muted">{c.area}</span>
            </label>
          ))}
        </div>
        {errors["staff-clinics"] && <p id="staff-clinics-error" className="mt-1.5 text-sm font-medium text-danger">{errors["staff-clinics"]}</p>}
      </fieldset>

      {serverError && <p role="alert" className="rounded-xl border-[1.5px] border-danger bg-danger-light px-4 py-3 font-medium text-danger">{serverError}</p>}
      <div className="flex flex-wrap gap-2.5">
        <button type="submit" disabled={busy} className={pill.primary}>
          {busy ? (editing ? t.staff.saving : t.staff.creating) : editing ? t.staff.save : t.staff.create}
        </button>
        <button type="button" onClick={onCancel} className={pill.outline}>{t.staff.cancel}</button>
      </div>
    </form>
  );
}

function InviteBox({ name, url, onClose }: { name: string; url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <section aria-live="polite" className="rounded-[20px] border-[1.5px] border-brand bg-brand-light p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-brand-dark">{t.staff.inviteTitle}</h2>
          <p className="mt-1 text-ink">{t.staff.inviteText(name)}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t.common.close} className="rounded-full px-2 text-xl text-ink">×</button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <input readOnly value={url} onFocus={(e) => e.target.select()} aria-label={t.staff.inviteTitle}
          className="min-w-0 flex-1 rounded-xl border-[1.5px] border-line bg-white px-3.5 py-2.5 font-mono text-sm" />
        <button
          type="button"
          className={pill.primary}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* the field can still be selected and copied by hand */
            }
          }}
        >
          {copied ? t.staff.copied : t.staff.copy}
        </button>
      </div>
    </section>
  );
}
