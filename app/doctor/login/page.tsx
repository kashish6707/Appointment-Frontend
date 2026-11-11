import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import { getCurrentDoctor } from "@/lib/session";
import LoginForm from "./LoginForm";

/** Only same-site paths, so ?next= can't send people to another website. */
function safeNext(next: string | string[] | undefined) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/doctor/dashboard";
}

export default async function DoctorLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const next = safeNext((await searchParams).next);
  // Already signed in with a valid session: skip the form. If the backend is down, just show the form.
  const doctor = await getCurrentDoctor().catch(() => null);
  if (doctor) redirect(next);

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-8 sm:py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <h1 className="text-[28px] font-bold leading-tight tracking-tight">Sign in to your doctor account</h1>
      <p className="mt-2 text-muted">Use the mobile number or email you registered with.</p>
      <LoginForm next={next} />
    </main>
  );
}
