import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import { getCurrentDoctor } from "@/lib/session";
import LogoutButton from "./LogoutButton";

// Placeholder dashboard: proves the session works end to end. The OPD queue comes next.
export default async function DoctorDashboard() {
  const doctor = await getCurrentDoctor();
  // Cookie present but the backend rejected it (expired or signed out elsewhere).
  if (!doctor) redirect("/doctor/login?next=/doctor/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-5 py-8 sm:py-12">
      <header className="flex items-center justify-between">
        <Logo size={36} />
        <LogoutButton />
      </header>
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">Welcome, {doctor.fullName}</h1>
        <p className="mt-2 text-muted">Your clinic and OPD timings will be set up here next.</p>
      </div>
    </main>
  );
}
