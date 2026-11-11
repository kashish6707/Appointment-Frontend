import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import StaffManager from "./StaffManager";

export const metadata: Metadata = { title: "Staff & access · Clinically" };

export default async function StaffPage() {
  const me = await getMe();
  if (!me) redirect("/doctor/login?next=/doctor/staff");
  // Only the doctor (root) manages access. The backend refuses staff too.
  if (me.viewer.type !== "DOCTOR" || !me.doctor) redirect("/doctor/dashboard");
  return <StaffManager doctor={me.doctor} />;
}
