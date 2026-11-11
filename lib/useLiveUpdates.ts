"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { Booking, OpdSession } from "./doctorApi";

export type LiveEvent =
  | { type: "booking.created" | "booking.updated" | "booking.cancelled"; booking: Booking }
  | { type: "session.updated"; session: OpdSession };

/**
 * Connects to the backend's Socket.IO server through this site's /api proxy, so the session
 * cookie is sent. Calls onEvent for every dashboard event, and onReconnect after a dropped
 * connection comes back (events may have been missed, so data should be refetched).
 */
export function useLiveUpdates(onEvent: (e: LiveEvent) => void, onReconnect: () => void) {
  const handlers = useRef({ onEvent, onReconnect });
  handlers.current = { onEvent, onReconnect };
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const socket = io({
      path: "/api/socket.io",
      // Next.js redirects /api/socket.io/ to drop the slash, which would break the handshake.
      addTrailingSlash: false,
      withCredentials: true,
    });
    let dropped = false;
    socket.on("connect", () => {
      setConnected(true);
      if (dropped) handlers.current.onReconnect();
    });
    socket.on("disconnect", (reason) => {
      // The server only disconnects us on purpose when the doctor changed this account's access:
      // reload so the page asks again what this account may see.
      if (reason === "io server disconnect") {
        window.location.reload();
        return;
      }
      dropped = true;
      setConnected(false);
    });
    for (const type of ["booking.created", "booking.updated", "booking.cancelled"] as const) {
      socket.on(type, (booking: Booking) => handlers.current.onEvent({ type, booking }));
    }
    socket.on("session.updated", (session: OpdSession) => handlers.current.onEvent({ type: "session.updated", session }));
    return () => {
      socket.disconnect();
    };
  }, []);

  return { connected };
}
