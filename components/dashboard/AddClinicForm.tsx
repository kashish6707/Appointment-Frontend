"use client";

import { useEffect, useState, type FormEvent } from "react";
import TextField from "@/components/ui/TextField";
import { ApiError } from "@/lib/api";
import { addClinic, getAreas, type ClinicSlot } from "@/lib/doctorApi";
import { t } from "@/lib/strings";
import { isIndianMobile } from "@/lib/validation";
import { Card, pill } from "./ui";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const DAY_LABEL: Record<(typeof DAYS)[number], string> = { MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun" };

type Field = "name" | "address" | "area" | "phone" | "fee" | "days" | "hours" | "limit";
type Errors = Partial<Record<Field, string>>;

/** A new doctor's first clinic (or another one): where, fee, OPD days and hours, daily limit. */
export default function AddClinicForm({ defaultFee, onAdded }: { defaultFee?: number | null; onAdded: (slot: ClinicSlot) => void }) {
  const [areas, setAreas] = useState<{ key: string; name: string }[]>([]);
  const [type, setType] = useState<"CLINIC" | "HOSPITAL">("CLINIC");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [areaKey, setAreaKey] = useState("");
  const [phone, setPhone] = useState("");
  const [fee, setFee] = useState(defaultFee != null ? String(defaultFee) : "");
  const [days, setDays] = useState<string[]>(["MON", "TUE", "WED", "THU", "FRI", "SAT"]);
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("14:00");
  const [limit, setLimit] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAreas().then((r) => setAreas(r.areas), () => setServerError(t.common.loadError));
  }, []);

  function toggleDay(d: string) {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: Errors = {};
    const feeNum = Number(fee);
    const limitNum = Number(limit);
    if (name.trim().length < 2) e.name = t.addClinic.errors.name;
    if (address.trim().length < 5) e.address = t.addClinic.errors.address;
    if (!areaKey) e.area = t.addClinic.errors.area;
    if (phone && !isIndianMobile(phone)) e.phone = t.addClinic.errors.phone;
    if (fee === "" || !Number.isInteger(feeNum) || feeNum < 0 || feeNum > 100000) e.fee = t.addClinic.errors.fee;
    if (!days.length) e.days = t.addClinic.errors.days;
    if (!start || !end || start >= end) e.hours = t.addClinic.errors.hours;
    if (limit && (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 500)) e.limit = t.addClinic.errors.limit;
    setErrors(e);
    setServerError("");
    const first = (["name", "address", "area", "phone", "fee", "days", "hours", "limit"] as Field[]).find((k) => e[k]);
    if (first) {
      document.getElementById(`clinic-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const slot = await addClinic({
        type, name: name.trim(), address: address.trim(), areaKey, ...(phone ? { phone } : {}),
        fee: feeNum, days, start, end, limit: limit ? limitNum : null,
      });
      onAdded(slot);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t.common.loadError);
      setBusy(false);
    }
  }

  const select = (bad?: string) =>
    `min-h-[50px] w-full rounded-xl border-[1.5px] bg-white px-3 text-base text-ink focus:border-brand focus:outline-none ${bad ? "border-danger" : "border-line"}`;
  const err = (k: Field) => errors[k] && <p id={`clinic-${k}-error`} className="mt-1.5 text-sm font-medium text-danger">{errors[k]}</p>;

  return (
    <Card title={t.addClinic.title}>
      <p className="-mt-1 mb-5 text-muted">{t.addClinic.intro}</p>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div role="radiogroup" aria-label={t.addClinic.type} className="flex gap-2">
          {(["CLINIC", "HOSPITAL"] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={type === k} onClick={() => setType(k)}
              className={`min-h-[44px] rounded-full border-[1.5px] px-5 font-semibold ${type === k ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand"}`}>
              {t.addClinic.types[k]}
            </button>
          ))}
        </div>
        <TextField id="clinic-name" label={t.addClinic.name} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <TextField id="clinic-address" label={t.addClinic.address} value={address} maxLength={300} onChange={(e) => setAddress(e.target.value)} error={errors.address} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="clinic-area" className="mb-1.5 block font-semibold text-ink">{t.addClinic.area}</label>
            <select id="clinic-area" value={areaKey} onChange={(e) => setAreaKey(e.target.value)} className={select(errors.area)}
              aria-invalid={errors.area ? true : undefined} aria-describedby={errors.area ? "clinic-area-error" : undefined}>
              <option value="" disabled>{t.addClinic.areaChoose}</option>
              {areas.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
            </select>
            {err("area")}
          </div>
          <TextField id="clinic-phone" label={t.addClinic.phone} prefix="+91" inputMode="numeric" maxLength={10} value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} error={errors.phone} />
        </div>
        <TextField id="clinic-fee" label={t.addClinic.fee} prefix="₹" inputMode="numeric" maxLength={6} value={fee}
          onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))} error={errors.fee} />
        <fieldset>
          <legend className="mb-1.5 font-semibold text-ink">{t.addClinic.days}</legend>
          <div id="clinic-days" tabIndex={-1} className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button key={d} type="button" aria-pressed={days.includes(d)} onClick={() => toggleDay(d)}
                className={`min-h-[44px] min-w-[56px] rounded-full border-[1.5px] px-3 font-semibold ${days.includes(d) ? "border-brand bg-brand text-white" : "border-line text-ink hover:border-brand"}`}>
                {DAY_LABEL[d]}
              </button>
            ))}
          </div>
          {err("days")}
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="clinic-hours" className="mb-1.5 block font-semibold text-ink">{t.addClinic.start}</label>
            <input id="clinic-hours" type="time" value={start} onChange={(e) => setStart(e.target.value)} className={select(errors.hours)}
              aria-invalid={errors.hours ? true : undefined} aria-describedby={errors.hours ? "clinic-hours-error" : undefined} />
          </div>
          <div>
            <label htmlFor="clinic-end" className="mb-1.5 block font-semibold text-ink">{t.addClinic.end}</label>
            <input id="clinic-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={select(errors.hours)} />
          </div>
        </div>
        {err("hours")}
        <TextField id="clinic-limit" label={t.addClinic.limit} hint={t.addClinic.limitHint} inputMode="numeric" maxLength={3} value={limit}
          onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))} error={errors.limit} />
        {serverError && <p role="alert" className="rounded-xl border-[1.5px] border-danger bg-danger-light px-4 py-3 font-medium text-danger">{serverError}</p>}
        <button type="submit" disabled={busy} className={`${pill.primary} min-h-[50px] text-[17px]`}>{busy ? t.addClinic.saving : t.addClinic.submit}</button>
      </form>
    </Card>
  );
}
