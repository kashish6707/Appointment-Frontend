import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import DashboardApp from "./DashboardApp";
import WorkplacePicker from "./WorkplacePicker";

export const metadata: Metadata = { title: "Dashboard · Clinically" };

export default async function DoctorDashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // middleware.ts already sent visitors without a cookie to sign in; this catches expired sessions.
  const me = await getMe();
  if (!me) redirect("/doctor/login?next=/doctor/dashboard");
  // A staff member who works for several doctors (or none any more) chooses first.
  if (!me.doctor) return <WorkplacePicker me={me} />;
  // "Switch doctor" from the top bar.
  if ((await searchParams).switch !== undefined && me.workplaces.length > 1) return <WorkplacePicker me={me} current={me.doctor.id} />;
  return <DashboardApp me={me} doctor={me.doctor} />;
}
