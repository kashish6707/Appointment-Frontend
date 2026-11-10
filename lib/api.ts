const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type RegisterDoctorInput = {
  fullName: string;
  method: "phone" | "email";
  phone?: string; // 10 digits, without +91
  email?: string;
  password: string;
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** POST /api/auth/doctor/register — see README for the request/response contract. */
export async function registerDoctor(input: RegisterDoctorInput): Promise<{ id: string }> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/doctor/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new ApiError(0, "Can’t reach the server. Check your internet connection and try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fallback =
      res.status === 409
        ? "An account with this phone number or email already exists. Sign in instead."
        : "Registration didn’t go through. Check your details and try again.";
    throw new ApiError(res.status, typeof body.message === "string" ? body.message : fallback);
  }
  return body;
}
