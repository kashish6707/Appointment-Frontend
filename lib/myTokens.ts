"use client";

// Tokens booked on this device, so "My tokens" can list them without a patient account.
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

export function loadTokens(): SavedToken[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
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
