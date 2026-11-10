import Link from "next/link";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-5 py-10">
      <Logo size={56} />
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-dark">Find the right doctor in Patna</h1>
        <p className="mt-2 text-muted">The patient app is coming next. Doctors can create their account now.</p>
      </div>
      <Link
        href="/doctor/register"
        className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3.5 text-[17px] font-semibold text-white hover:bg-brand-dark"
      >
        Register as a doctor
      </Link>
    </main>
  );
}
