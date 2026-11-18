import { NextResponse, type NextRequest } from "next/server";

// Keep in sync with SESSION_COOKIE in lib/session.ts (middleware can't import server-only modules).
const SESSION_COOKIE = "clinically_session";

/**
 * APP_MODE decides which side of the app this server shows:
 * - "all" (default): patient and doctor pages together, e.g. for local development.
 * - "patient": the patient app only; doctor and staff pages return 404.
 * - "doctor": the doctor app only; every other page goes to /doctor/login.
 * It's read when the server starts (and at build time for `next build`).
 */
const MODE = (process.env.APP_MODE ?? "all").toLowerCase();

// Doctor-side pages that need a signed-in account.
const SIGNED_IN_ONLY = ["/doctor/dashboard", "/doctor/staff", "/doctor/schedule", "/doctor/profile"];

const isDoctorSide = (path: string) => path === "/doctor" || path.startsWith("/doctor/") || path.startsWith("/staff/");

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (MODE === "patient" && isDoctorSide(path)) {
    return new NextResponse("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  }
  if (MODE === "doctor" && !isDoctorSide(path)) {
    return NextResponse.redirect(new URL("/doctor/login", req.url));
  }

  // A fast first check: no cookie means straight to sign in. Pages still ask the backend
  // whether the session is valid.
  if (SIGNED_IN_ONLY.some((p) => path === p || path.startsWith(`${p}/`)) && !req.cookies.has(SESSION_COOKIE)) {
    const url = req.nextUrl.clone();
    url.pathname = "/doctor/login";
    url.search = `?next=${encodeURIComponent(path + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Every page, but not the API proxy, Next's own files, or static files.
export const config = { matcher: ["/((?!api/|_next/|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)"] };
