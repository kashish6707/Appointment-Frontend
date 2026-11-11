import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import ScheduleManager from "./ScheduleManager";

export const metadata: Metadata = { title: "OPD timings · Clinically" };

export default async function SchedulePage() {
  const me = await getMe();
  if (!me) redirect("/doctor/login?next=/doctor/schedule");
  // The doctor, or staff the doctor allowed to change timings. The backend checks this too.
  if (!me.doctor || !me.viewer.permissions.includes("schedule.manage")) redirect("/doctor/dashboard");
  return <ScheduleManager doctor={me.doctor} />;
}
