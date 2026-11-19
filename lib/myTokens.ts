"use client";

// Tokens booked on this device by someone not signed in, so "My tokens" can list them without a
// patient account. Signed-in patients' tokens live in their account instead.
// Each entry holds the tracking code: anyone with it can see the booking's queue position (no
// medical details), the same as the tracking link the patient can share.

import { useEffect, useState } from "react";

export type SavedToken = {
  bookingId: string;
  code: string;
  token: number | null;
  date: string; // YYYY-MM-DD
  doctorName: string;
  clinicName: string;
  patientName: string;
  savedAt: string;
};

const KEY = "clinically.tokens";
const EVENT = "clinically-tokens";
const MAX = 30;

/** Today in India as YYYY-MM-DD (same as lib/time todayIST, kept here to avoid a cycle). */
function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/**
 * Today's and upcoming tokens saved on this device. Past ones are dropped (and removed from
 * storage), so a shared phone or the clinic's tablet doesn't keep showing old patients' tokens.
 */
export function loadTokens(): SavedToken[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(list)) return [];
    const kept = list.filter((x: SavedToken) => typeof x?.date === "string" && x.date >= today());
    if (kept.length !== list.length) localStorage.setItem(KEY, JSON.stringify(kept));
    return kept;
  } catch {
    return [];
  }
}

/** Remove every token saved on this device (sign out, or "Clear from this phone"). */
export function clearTokens() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

export function saveToken(t: Omit<SavedToken, "savedAt">) {
  try {
    const rest = loadTokens().filter((x) => x.bookingId !== t.bookingId);
    localStorage.setItem(KEY, JSON.stringify([{ ...t, savedAt: new Date().toISOString() }, ...rest].slice(0, MAX)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage blocked: the tracking link still works */
  }
}

export function forgetToken(bookingId: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadTokens().filter((x) => x.bookingId !== bookingId)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

export function useSavedTokens() {
  const [tokens, setTokens] = useState<SavedToken[] | null>(null);
  useEffect(() => {
    const read = () => setTokens(loadTokens());
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);
  return tokens;
}
