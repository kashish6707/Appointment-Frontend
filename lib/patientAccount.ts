// The patient's own account: sign up and in, family profiles, records and bookings.
// Calls go to the backend's /api/patient/* through this site's /api proxy. The session is the
// httpOnly cookie "clinically_patient" (separate from the doctor's), so no token is ever handled here.

import { request } from "./api";

export type Relation = "SELF" | "SPOUSE" | "MOTHER" | "FATHER" | "SON" | "DAUGHTER" | "BROTHER" | "SISTER" | "GRANDPARENT" | "OTHER";
export const RELATIONS: Relation[] = ["SPOUSE", "MOTHER", "FATHER", "SON", "DAUGHTER", "BROTHER", "SISTER", "GRANDPARENT", "OTHER"];
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type Gender = "MALE" | "FEMALE" | "OTHER";

export type Member = {
  id: string;
  name: string;
  relation: Relation;
  phone: string | null;
  dateOfBirth: string | null;
  age: number | null;
  gender: Gender | null;
  heightCm: number | null;
  weightKg: number | null;
  bloodGroup: string | null;
  allergies: string | null;
  conditions: string | null;
  surgeries: string | null;
  medicines: string | null;
  emergencyName: string | null;
  emergencyRelation: string | null;
  emergencyPhone: string | null;
  addressArea: string | null;
  addressCity: string | null;
  recordsConsent: boolean;
  recordCount: number;
  updatedAt: string | null;
};

export type MemberInput = Omit<Member, "id" | "recordCount" | "updatedAt" | "recordsConsent" | "relation"> & {
  relation: Relation;
  recordsConsent?: boolean;
};

export type Me = {
  account: { id: string; fullName: string; phone: string | null; email: string | null };
  members: Member[];
};

export type RecordItem = {
  id: string;
  kind: "PRESCRIPTION" | "REPORT";
  title: string;
  date: string;
  addedBy: "PATIENT" | "CLINIC";
  contentType: string;
  fileUrl: string;
};

export type AccountBooking = {
  bookingId: string;
  token: number;
  status: string;
  date: string;
  memberId: string;
  patientName: string;
  doctorName: string;
  clinicName: string;
};

type Contact = { method: "phone"; phone: string } | { method: "email"; email: string };

const post = <T,>(path: string, body: unknown = {}) => request<T>(path, { method: "POST", body: JSON.stringify(body) });

export const register = (input: Contact & { fullName: string; password: string }) => post<Me>("/api/patient/auth/register", input);
export const signIn = (input: Contact & { password: string }) =>
  request<Me>("/api/patient/auth/login", { method: "POST", body: JSON.stringify(input) }, { 401: "That mobile number, email or password is wrong." });
export const signOut = () => post<void>("/api/patient/auth/logout");
export const forgotPassword = (email: string) => post<{ message: string }>("/api/patient/auth/forgot", { email });
export const resetPassword = (token: string, password: string) => post<Me>("/api/patient/auth/reset", { token, password });

/** The signed-in account, or null when signed out. */
export async function getMe(): Promise<Me | null> {
  try {
    return await request<Me>("/api/patient/me");
  } catch (e) {
    if (e instanceof Error && "status" in e && (e as { status: number }).status === 401) return null;
    throw e;
  }
}

export const addMember = (input: MemberInput) => post<Member>("/api/patient/members", input);
export const updateMember = (id: string, input: MemberInput) =>
  request<Member>(`/api/patient/members/${id}`, { method: "PUT", body: JSON.stringify(input) });
export const removeMember = (id: string) => request<void>(`/api/patient/members/${id}`, { method: "DELETE" });

export const listRecords = (memberId: string) => request<{ records: RecordItem[] }>(`/api/patient/members/${memberId}/records`);
export const addRecord = (memberId: string, input: { kind: RecordItem["kind"]; title: string; date: string; file: string }) =>
  post<RecordItem>(`/api/patient/members/${memberId}/records`, input);
export const deleteRecord = (id: string) => request<void>(`/api/patient/records/${id}`, { method: "DELETE" });

export const myBookings = () => request<{ bookings: AccountBooking[] }>("/api/patient/bookings");
/** A tracking code for this device, so the live queue page can open. */
export const bookingLink = (bookingId: string) => post<{ bookingId: string; code: string }>(`/api/patient/bookings/${bookingId}/link`);

/** The member as the form's starting values. */
export function toInput(m: Member): MemberInput {
  const { id: _id, recordCount: _c, updatedAt: _u, ...rest } = m;
  return rest;
}
