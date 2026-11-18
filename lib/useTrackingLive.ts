"use client";

import { useEffect, useRef, useState } from "react";
import { bookingSocket } from "./socket";

/**
 * Live updates for one booking's tracking page. No sign-in: the tracking code is sent as the
 * Socket.IO auth, and the server only lets it hear about that booking and its OPD queue.
 * Any event (or a reconnect) calls onChange, and the page refetches the full status, so it
 * never shows a half-updated position.
 */
export function useTrackingLive(bookingId: string, code: string, onChange: () => void, enabled = true) {
  const handler = useRef(onChange);
  handler.current = onChange;
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    if (!enabled || !code) return;
    const socket = bookingSocket(bookingId, code);
    let dropped = false;
    socket.on("connect", () => {
      setConnected(true);
      if (dropped) handler.current();
    });
    socket.on("disconnect", () => {
      dropped = true;
      setConnected(false);
    });
    socket.on("connect_error", () => setConnected(false));
    socket.on("session.updated", () => handler.current());
    socket.on("booking.updated", () => handler.current());

    // Phones pause background tabs: catch up when the page is shown again.
    const onVisible = () => document.visibilityState === "visible" && handler.current();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      socket.disconnect();
    };
  }, [bookingId, code, enabled]);

  return { connected };
}
