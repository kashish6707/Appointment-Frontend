import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import ProfileEditor from "./ProfileEditor";

export const metadata: Metadata = { title: "Your profile · Clinically" };

export default async function ProfilePage() {
  const me = await getMe();
  if (!me) redirect("/doctor/login?next=/doctor/profile");
  // Only the doctor edits their own profile. The backend refuses staff too.
  if (me.viewer.type !== "DOCTOR") redirect("/doctor/dashboard");
  return <ProfileEditor />;
}
