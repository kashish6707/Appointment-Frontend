"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getMe, signOut as apiSignOut, type Me } from "@/lib/patientAccount";

type AccountState = {
  /** undefined while loading, null when signed out. */
  me: Me | null | undefined;
  setMe: (me: Me | null) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AccountState>({ me: null, setMe: () => {}, refresh: async () => {}, signOut: async () => {} });

export function useAccount() {
  return useContext(Ctx);
}

/** Who is signed in on the patient side. Loaded once per page load; pages update it after changes. */
export function AccountProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const refresh = useCallback(async () => {
    try {
      setMe(await getMe());
    } catch {
      setMe((cur) => cur ?? null); // offline: keep what we had
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const signOut = useCallback(async () => {
    try {
      await apiSignOut();
    } finally {
      setMe(null);
    }
  }, []);
  return <Ctx.Provider value={{ me, setMe, refresh, signOut }}>{children}</Ctx.Provider>;
}
