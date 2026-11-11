import "server-only";
import { cookies } from "next/headers";
import type { Me } from "./doctorApi";

/** Name of the httpOnly cookie the backend sets on sign-in. Must match the backend. */
export const SESSION_COOKIE = "clinically_session";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

/**
 * Who is signed in (GET /api/doctor/me): a doctor, or a staff member and the doctor they work for.
 * For server components. Returns null when there is no cookie or the session is invalid or expired.
 */
export async function getMe(): Promise<Me | null> {
  const session = (await cookies()).get(SESSION_COOKIE);
  if (!session) return null;
  const res = await fetch(`${API_URL}/api/doctor/me`, {
    headers: { Cookie: `${SESSION_COOKIE}=${session.value}` },
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`GET /api/doctor/me failed with ${res.status}`);
  return (await res.json()) as Me;
}
