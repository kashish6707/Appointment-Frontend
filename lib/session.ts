import "server-only";
import { cookies } from "next/headers";
import type { Doctor } from "./api";

/** Name of the httpOnly cookie the backend sets on sign-in. Must match the backend. */
export const SESSION_COOKIE = "clinically_session";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

/**
 * Asks the backend who is signed in, for use in server components.
 * Returns null when there is no cookie or the backend says the session is invalid or expired.
 */
export async function getCurrentDoctor(): Promise<Doctor | null> {
  const session = (await cookies()).get(SESSION_COOKIE);
  if (!session) return null;
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Cookie: `${SESSION_COOKIE}=${session.value}` },
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`GET /api/auth/me failed with ${res.status}`);
  const body = await res.json();
  return body.doctor as Doctor;
}
