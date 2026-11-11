"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { ApiError } from "@/lib/api";
import { chooseWorkplace, type Me } from "@/lib/doctorApi";
import { t } from "@/lib/strings";
import LogoutButton from "./LogoutButton";

/** For staff: choose which doctor's OPD this browser works on. */
export default function WorkplacePicker({ me, current }: { me: Me; current?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function choose(doctorId: string) {
    setBusy(doctorId);
    setError("");
    try {
      await chooseWorkplace(doctorId);
      router.replace("/doctor/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.common.loadError);
      setBusy(null);
    }
  }

  const none = me.workplaces.length === 0;
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-5 py-8 sm:py-12">
      <div className="flex items-center justify-between">
        <Logo />
        <LogoutButton />
      </div>
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{none ? t.workplace.noAccessTitle : t.workplace.title}</h1>
        <p className="mt-2 text-muted">{none ? t.workplace.noAccessText : t.workplace.intro}</p>
      </div>
      {!none && (
        <ul className="flex flex-col gap-3">
          {me.workplaces.map((w) => (
            <li key={w.doctorId}>
              <button
                type="button"
                onClick={() => choose(w.doctorId)}
                disabled={!!busy}
                aria-current={w.doctorId === current ? "true" : undefined}
                className={`flex w-full items-center justify-between gap-3 rounded-[20px] border bg-white p-5 text-left shadow-soft transition-colors hover:border-brand disabled:opacity-60 ${
                  w.doctorId === current ? "border-brand" : "border-line"
                }`}
              >
                <span>
                  <span className="block text-lg font-bold text-ink">{w.doctorName}</span>
                  <span className="block text-muted">{t.roles[w.role]}</span>
                </span>
                <span className="font-semibold text-brand">{busy === w.doctorId ? "…" : "→"}</span>
                <span className="sr-only">{t.workplace.choose(w.doctorName)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="rounded-xl border-[1.5px] border-danger bg-danger-light px-4 py-3 font-medium text-danger">{error}</p>}
    </main>
  );
}
