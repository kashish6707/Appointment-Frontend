"use client";

import { useState, type FormEvent } from "react";
import TextField from "@/components/TextField";
import { ApiError } from "@/lib/api";
import { addWalkIn, type Booking, type Gender } from "@/lib/doctorApi";
import { t } from "@/lib/strings";
import { isIndianMobile } from "@/lib/validation";
import { Card, ConfirmDialog, pill } from "./ui";

type Errors = Partial<Record<"name" | "age" | "gender" | "phone", string>>;

export default function WalkInForm({ sessionId, onAdded }: { sessionId: string | null; onAdded: (b: Booking) => void }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  // Set when the day's limit is reached: the desk can still add this walk-in after confirming.
  const [overLimit, setOverLimit] = useState<{ limit: number; booked: number } | null>(null);

  async function save(force: boolean) {
    if (!sessionId) return;
    setBusy(true);
    try {
      const { booking } = await addWalkIn(sessionId, {
        name: name.trim(), age: Number(age), gender: gender as Gender, ...(phone ? { phone } : {}), ...(force ? { overLimit: true } : {}),
      });
      onAdded(booking);
      setName(""); setAge(""); setGender(""); setPhone("");
      setOverLimit(null);
    } catch (err) {
      if (err instanceof ApiError && err.code === "LIMIT_REACHED") {
        setOverLimit({ limit: Number(err.data.limit), booked: Number(err.data.booked) });
      } else {
        setOverLimit(null);
        setServerError(err instanceof ApiError ? err.message : t.common.loadError);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!sessionId) return;
    const e: Errors = {};
    const ageNum = Number(age);
    if (name.trim().length < 2) e.name = t.walkIn.errors.name;
    if (age === "" || !Number.isInteger(ageNum) || ageNum < 0 || ageNum > 120) e.age = t.walkIn.errors.age;
    if (!gender) e.gender = t.walkIn.errors.gender;
    if (phone && !isIndianMobile(phone)) e.phone = t.walkIn.errors.phone;
    setErrors(e);
    setServerError("");
    if (Object.keys(e).length) {
      document.getElementById(`walkin-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    await save(false);
  }

  return (
    <Card title={t.walkIn.title}>
      {!sessionId ? (
        <p className="text-muted">{t.walkIn.unavailable}</p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <TextField id="walkin-name" label={t.walkIn.name} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="off" />
          <div className="grid grid-cols-2 gap-3">
            <TextField id="walkin-age" label={t.walkIn.age} inputMode="numeric" maxLength={3} value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} error={errors.age} />
            <div>
              <label htmlFor="walkin-gender" className="mb-1.5 block font-semibold text-ink">{t.walkIn.gender}</label>
              <select
                id="walkin-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                aria-invalid={errors.gender ? true : undefined}
                aria-describedby={errors.gender ? "walkin-gender-error" : undefined}
                className={`w-full rounded-xl border-[1.5px] bg-white px-3 py-3 text-base text-ink focus:border-brand focus:outline-none ${errors.gender ? "border-danger" : "border-line"}`}
              >
                <option value="" disabled>—</option>
                {(Object.keys(t.gender) as Gender[]).map((g) => <option key={g} value={g}>{t.gender[g]}</option>)}
              </select>
              {errors.gender && <p id="walkin-gender-error" className="mt-1.5 text-sm font-medium text-danger">{errors.gender}</p>}
            </div>
          </div>
          <TextField id="walkin-phone" label={t.walkIn.phone} prefix="+91" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} error={errors.phone} />
          {serverError && <p role="alert" className="rounded-xl border-[1.5px] border-danger bg-danger-light px-4 py-3 font-medium text-danger">{serverError}</p>}
          <button type="submit" disabled={busy} className={pill.primary}>{busy ? t.walkIn.adding : t.walkIn.submit}</button>
        </form>
      )}
      <ConfirmDialog
        open={!!overLimit}
        title={t.walkIn.overLimitTitle}
        text={overLimit ? t.walkIn.overLimitText(overLimit.limit, overLimit.booked) : ""}
        confirmLabel={t.walkIn.overLimitConfirm}
        busy={busy}
        onCancel={() => setOverLimit(null)}
        onConfirm={() => save(true)}
      />
    </Card>
  );
}
