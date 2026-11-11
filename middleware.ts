import { NextResponse, type NextRequest } from "next/server";

// Keep in sync with SESSION_COOKIE in lib/session.ts (middleware can't import server-only modules).
const SESSION_COOKIE = "clinically_session";

/**
 * Fast first check for signed-in pages: no cookie means straight to sign in.
 * It only checks that the cookie exists. Pages still ask the backend whether the session is valid.
 */
export function middleware(req: NextRequest) {
  if (req.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/doctor/login";
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

// Signed-in doctor pages. Add new ones here.
export const config = { matcher: ["/doctor/dashboard/:path*", "/doctor/staff/:path*", "/doctor/schedule/:path*", "/doctor/profile/:path*"] };
