// Browser-side API client. Every call goes to /api/* on this site, which next.config.mjs
// forwards to the backend, so the httpOnly session cookie is sent and stored automatically.

export type Doctor = { id: string; fullName: string };

export type RegisterDoctorInput = {
  fullName: string;
  method: "phone" | "email";
  phone?: string; // 10 digits, without +91
  email?: string;
  password: string;
};

export type LoginDoctorInput = {
  method: "phone" | "email";
  phone?: string;
  email?: string;
  password: string;
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const OFFLINE = "Can’t reach the server. Check your internet connection and try again.";

async function request<T>(path: string, init: RequestInit, fallbacks: Record<number, string>, defaultMessage: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(0, OFFLINE);
  }
  const body = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof body.message === "string" ? body.message : fallbacks[res.status] ?? defaultMessage;
    throw new ApiError(res.status, message);
  }
  return body as T;
}

/** POST /api/auth/doctor/register — see README. */
export function registerDoctor(input: RegisterDoctorInput) {
  return request<{ id: string }>(
    "/api/auth/doctor/register",
    { method: "POST", body: JSON.stringify(input) },
    { 409: "An account with this phone number or email already exists. Sign in instead." },
    "Registration didn’t go through. Check your details and try again.",
  );
}

/** POST /api/auth/doctor/login — the backend sets the session cookie. */
export function loginDoctor(input: LoginDoctorInput) {
  return request<{ doctor: Doctor }>(
    "/api/auth/doctor/login",
    { method: "POST", body: JSON.stringify(input) },
    {
      401: "That mobile number, email or password is wrong. Check and try again.",
      429: "Too many attempts. Wait a few minutes and try again.",
    },
    "Sign in didn’t go through. Please try again.",
  );
}

/** POST /api/auth/logout — the backend ends the session and clears the cookie. */
export function logout() {
  return request<object>("/api/auth/logout", { method: "POST" }, {}, "Couldn’t sign out. Please try again.");
}
