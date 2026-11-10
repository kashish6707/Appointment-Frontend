import Link from "next/link";
import Logo from "@/components/Logo";

// Placeholder until the sign-in screen is built.
export default function DoctorLogin() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-10">
      <Logo />
      <h1 className="text-2xl font-bold">Doctor sign in</h1>
      <p className="text-muted">Sign in will be added in the next step.</p>
      <Link href="/doctor/register" className="font-semibold text-brand underline underline-offset-4">
        Create a doctor account
      </Link>
    </main>
  );
}
