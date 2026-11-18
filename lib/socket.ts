"use client";

import { io, type Socket } from "socket.io-client";

// Where live updates come from.
// - Not set (local development): through this site's /api proxy, like every other call.
// - NEXT_PUBLIC_REALTIME_URL (e.g. https://clinically-api.onrender.com): straight to the
//   backend, for hosts like Vercel whose proxy can't carry WebSockets. Signed-in pages then send
//   a one-minute ticket (fetched through the proxy, where the cookie is) instead of the cookie.
const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL || "";
const PATH = "/api/socket.io";

/** For a patient's tracking page: the tracking code is the auth, no cookie needed. */
export function bookingSocket(bookingId: string, code: string): Socket {
  const opts = { path: PATH, addTrailingSlash: false, auth: { bookingId, code }, reconnectionDelayMax: 10_000 };
  return REALTIME_URL ? io(REALTIME_URL, opts) : io(opts);
}

/** For the dashboard (doctor or staff). */
export function dashboardSocket(): Socket {
  if (!REALTIME_URL) {
    // Next.js redirects /api/socket.io/ to drop the slash, which would break the handshake.
    return io({ path: PATH, addTrailingSlash: false, withCredentials: true });
  }
  return io(REALTIME_URL, {
    path: PATH,
    addTrailingSlash: false,
    // Called before every connection attempt, so a reconnect gets a fresh ticket.
    auth: (cb) => {
      fetch("/api/auth/realtime-ticket", { credentials: "same-origin" })
        .then((r) => (r.ok ? r.json() : {}))
        .then((d: { ticket?: string }) => cb({ ticket: d.ticket ?? "" }), () => cb({ ticket: "" }));
    },
  });
}
