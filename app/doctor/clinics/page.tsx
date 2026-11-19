import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import ClinicPhotos from "./ClinicPhotos";

export const metadata: Metadata = { title: "Clinic photos" };

export default async function ClinicPhotosPage() {
  const me = await getMe();
  if (!me) redirect("/doctor/login?next=/doctor/clinics");
  // Only the doctor edits clinic details. The backend refuses staff too.
  if (me.viewer.type !== "DOCTOR" || !me.doctor) redirect("/doctor/dashboard");
  // A clinic can host more than one of the doctor's OPD slots: show it once.
  const seen = new Set<string>();
  const clinics = me.doctor.clinics
    .filter((c) => !seen.has(c.clinicId) && seen.add(c.clinicId))
    .map((c) => ({ id: c.clinicId, name: c.name, area: c.area }));
  return <ClinicPhotos clinics={clinics} />;
}
