"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Socket } from "socket.io-client";
import { liveSocket } from "./socket";

// Today's queue at each doctor-clinic shown on screen: OPD status, the token with the doctor and
// how many are waiting. One shared connection for the whole page; it re-joins with the new list
// when cards come and go. Public data only (no patient details).

export type LiveSlot = { sessionStatus: string | null; withDoctor: number | null; waiting: number | null };

const MAX = 60;
const values = new Map<string, LiveSlot>();
const listeners = new Set<() => void>();
const watched = new Map<string, number>(); // id -> how many cards show it
let socket: Socket | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function changed() {
  listeners.forEach((l) => l());
}

function reconnect() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    socket?.disconnect();
    socket = null;
    const ids = [...watched.keys()].slice(0, MAX);
    if (!ids.length) return;
    socket = liveSocket(ids);
    socket.on("live.updated", (p: LiveSlot & { doctorClinicId: string }) => {
      values.set(p.doctorClinicId, { sessionStatus: p.sessionStatus, withDoctor: p.withDoctor, waiting: p.waiting });
      changed();
    });
  }, 300);
}

function watch(id: string) {
  const n = watched.get(id) ?? 0;
  watched.set(id, n + 1);
  if (n === 0) reconnect();
  return () => {
    const left = (watched.get(id) ?? 1) - 1;
    if (left > 0) watched.set(id, left);
    else {
      watched.delete(id);
      reconnect();
    }
  };
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** The live status of one doctor-clinic: the latest pushed update, else what the page loaded with. */
export function useLiveSlot(doctorClinicId: string, initial: LiveSlot): LiveSlot {
  useEffect(() => watch(doctorClinicId), [doctorClinicId]);
  const live = useSyncExternalStore(subscribe, () => values.get(doctorClinicId), () => undefined);
  return live ?? initial;
}
