"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await logout();
    } catch {
      // Still leave the page: the backend clears the cookie when it can, and the next page re-checks the session.
    }
    router.replace("/doctor/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="rounded-full border-[1.5px] border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-60"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
