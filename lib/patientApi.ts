// Patient data. Pages only call these functions, so where the data comes from can change here
// without touching any page.
//
// USE_SAMPLE_DATA (NEXT_PUBLIC_USE_SAMPLE_DATA=true) serves everything from lib/sampleData.ts, for
// demos without a backend. Otherwise calls go to the backend's /api/public endpoints through this
// site's /api proxy (next.config.mjs), which forwards them to API_URL. States and districts other
// than Patna always come from the sample data until the backend covers them.

import { request } from "./api";
import {
  sampleAreas,
  sampleClinicCards,
  sampleClinicDetails,
  sampleClinicDoctors,
  sampleDepartments,
  sampleDistricts,
  sampleStates,
} from "./sampleData";

export const USE_SAMPLE_DATA = process.env.NEXT_PUBLIC_USE_SAMPLE_DATA === "true";

// --- shapes (the backend's /api/public responses) ------------------------------------------

export type OpdStatus = "OPEN_NOW" | "OPENS_LATER" | "CLOSED_TODAY";
export type ClinicType = "CLINIC" | "HOSPITAL";

export type Department = { key: string; nameEn: string; nameHi: string; iconKey: string };

export type DoctorCard = {
  id: string;
  doctorClinicId: string; // what booking needs: this doctor at this clinic
  name: string;
  nameHi: string | null;
  department: string | null;
  departmentKey: string | null;
  designation: string | null;
  degree: string | null;
  experienceYears: number | null;
  fee: number;
  registrationNo: string | null; // only if the doctor agreed to show it
  photoUrl: string | null; // only if the doctor agreed; otherwise show initials
  initials: string;
  waitingToday?: number | null;
  opensAt?: string | null;
  opdStatus?: OpdStatus;
};

export type ClinicCard = {
  id: string;
  name: string;
  nameHi: string | null;
  type: ClinicType;
  coverPhotoUrl: string | null;
  coverColour?: string; // sample data only: tint for the placeholder picture
  address: string;
  areaName: string;
  distanceKm: number | null;
  doctorCount: number;
  departmentCount: number;
  departmentKeys: string[];
  summary: string;
  opdStatus: OpdStatus;
  opensAt: string | null;
  waitingNow: number;
  doctors: DoctorCard[];
};

export type HomeResult = { departments: Department[]; clinics: ClinicCard[]; nextCursor: string | null };

export type Photo = { id: string; large: string; small: string; width: number; height: number };

export type ClinicDetails = {
  id: string;
  type: ClinicType;
  name: string;
  nameHi: string | null;
  address: string;
  areaName: string;
  lat: number | null;
  lng: number | null;
  locationIsApproximate: boolean;
  phone: string | null;
  opdHoursTextEn: string | null;
  opdHoursTextHi: string | null;
  coverPhoto: { large: string; small: string } | null;
  coverColour?: string;
  photos: Photo[];
  opdStatus: OpdStatus;
  opensAt: string | null;
  waitingNow: number;
  departments: Department[];
  doctorCount: number;
};

export type State = { id: string; name: string; nameHi: string };
export type District = { id: string; stateId: string; name: string; nameHi: string };
export type Area = {
  id: string;
  districtId: string;
  name: string;
  nameHi: string;
  doctorCount: number | null;
  lat?: number;
  lng?: number;
  backendId?: string; // the backend's area id, when the backend knows this area
};

export type HomeParams = {
  areaId?: string; // the backend's area id
  lat?: number;
  lng?: number;
  type?: "all" | "clinic" | "hospital";
  openNow?: boolean;
  department?: string;
  q?: string;
  cursor?: string | null;
};

// --- calls -----------------------------------------------------------------------------------

function query(params: Record<string, string | number | boolean | null | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "" && v !== false) q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

const fold = (s: string) => s.toLowerCase();

export async function getHome(params: HomeParams = {}): Promise<HomeResult> {
  if (!USE_SAMPLE_DATA) {
    return request<HomeResult>(
      `/api/public/home${query({ areaId: params.areaId, lat: params.lat, lng: params.lng, type: params.type, openNow: params.openNow, department: params.department, q: params.q, cursor: params.cursor })}`,
    );
  }
  const words = fold((params.q ?? "").trim());
  const clinics = sampleClinicCards().filter((c) => {
    if (params.type === "clinic" && c.type !== "CLINIC") return false;
    if (params.type === "hospital" && c.type !== "HOSPITAL") return false;
    if (params.openNow && c.opdStatus !== "OPEN_NOW") return false;
    if (params.department && !c.departmentKeys.includes(params.department)) return false;
    if (words) {
      const texts = [c.name, c.nameHi ?? "", c.areaName, ...c.doctors.flatMap((d) => [d.name, d.department ?? ""])];
      const departments = sampleDepartments.filter((d) => c.departmentKeys.includes(d.key)).flatMap((d) => [d.nameEn, d.nameHi]);
      if (![...texts, ...departments].some((t) => fold(t).includes(words))) return false;
    }
    return true;
  });
  return { departments: sampleDepartments, clinics, nextCursor: null };
}

export async function getClinic(id: string): Promise<ClinicDetails | null> {
  if (USE_SAMPLE_DATA) return sampleClinicDetails(id);
  try {
    return await request<ClinicDetails>(`/api/public/clinics/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof Error && "status" in err && (err as { status: number }).status === 404) return null;
    throw err;
  }
}

export async function getClinicDoctors(id: string, department?: string): Promise<DoctorCard[]> {
  if (USE_SAMPLE_DATA) {
    const all = sampleClinicDoctors(id);
    return department ? all.filter((d) => d.departmentKey === department) : all;
  }
  // The backend pages 10 at a time; a clinic's doctors are few, so read every page.
  const doctors: DoctorCard[] = [];
  let cursor: string | null = null;
  do {
    const r: { doctors: DoctorCard[]; nextCursor: string | null } = await request(
      `/api/public/clinics/${encodeURIComponent(id)}/doctors${query({ department, cursor })}`,
    );
    doctors.push(...r.doctors);
    cursor = r.nextCursor;
  } while (cursor && doctors.length < 200);
  return doctors;
}

export async function getStates(): Promise<State[]> {
  return sampleStates;
}

export async function getDistricts(stateId: string): Promise<District[]> {
  return sampleDistricts.filter((d) => d.stateId === stateId);
}

export async function getAreas(districtId: string, search?: string): Promise<Area[]> {
  let areas = sampleAreas.filter((a) => a.districtId === districtId);
  if (!USE_SAMPLE_DATA && districtId === "patna") {
    // Patna's areas come from the backend, so the home feed can measure distance from them.
    const r = await request<{ areas: { id: string; key: string; name: string; nameHi: string }[] }>("/api/public/areas");
    areas = r.areas.map((a) => {
      const sample = sampleAreas.find((s) => s.id === a.key);
      return { id: a.key, districtId, name: a.name, nameHi: a.nameHi, doctorCount: null, lat: sample?.lat, lng: sample?.lng, backendId: a.id };
    });
  }
  const words = fold((search ?? "").trim());
  return words ? areas.filter((a) => fold(a.name).includes(words) || a.nameHi.includes(words)) : areas;
}

// --- booking a token and tracking it -----------------------------------------------------------

export type Gender = "MALE" | "FEMALE" | "OTHER";
export type VisitType = "NEW" | "FOLLOW_UP" | "REPORT_REVIEW";

export type BookingDay = {
  date: string; // YYYY-MM-DD
  open: boolean;
  start: string | null; // "10:00"
  end: string | null;
  limit: number | null;
  note: string | null;
  booked: number;
  left: number | null;
  bookable: boolean;
  reason: "NOT_AVAILABLE" | "HOURS_OVER" | "FULL" | null;
};

export type Availability = {
  doctorClinicId: string;
  doctor: { id: string; name: string; nameHi: string | null; department: string | null; designation: string | null };
  clinic: { id: string; name: string; nameHi: string | null; area: string; address: string };
  fee: number;
  tokenAmount: number;
  days: BookingDay[];
};

export type NewBooking = {
  doctorClinicId: string;
  date: string;
  visitType: VisitType;
  patient: { name: string; phone: string; age: number; gender: Gender };
  recordsConsent: boolean;
};

export type BookingStatus = "WAITING" | "WITH_DOCTOR" | "DONE" | "SENT_FOR_TESTS" | "NO_SHOW" | "CANCELLED" | "PENDING_PAYMENT" | "PAYMENT_FAILED";
export type SessionStatus = "NOT_STARTED" | "IN_OPD" | "ON_BREAK" | "CLOSED";

export type Tracking = {
  bookingId: string;
  token: number | null;
  status: BookingStatus;
  nowServing: number | null;
  /** The token with the doctor right now, or null between patients. */
  withDoctor?: number | null;
  patientsAhead: number | null;
  estimatedMinutes: number | null;
  expectedAt?: string | null;
  sessionStatus: SessionStatus | null;
  breakUntil?: string | null;
  date: string;
  doctorName: string;
  clinicName: string;
  opdStart: string;
  opdEnd?: string;
  dayNote?: string | null;
  messages?: { kind: string; text: string; createdAt: string }[];
};

const BOOKING_FALLBACKS = { 404: "We couldn't find this booking. Check the link and try again." };

export function getAvailability(doctorClinicId: string): Promise<Availability> {
  return request(`/api/public/clinics/${encodeURIComponent(doctorClinicId)}/availability`, {}, { 404: "This doctor isn't taking bookings here." });
}

export function createBooking(body: NewBooking): Promise<{ bookingId: string; token: number | null; trackingCode: string }> {
  return request("/api/public/bookings", { method: "POST", body: JSON.stringify(body) });
}

export function getTracking(bookingId: string, code: string): Promise<Tracking> {
  return request(`/api/public/bookings/${encodeURIComponent(bookingId)}${query({ code })}`, {}, BOOKING_FALLBACKS);
}

export function cancelBooking(bookingId: string, code: string): Promise<{ status: string }> {
  return request(`/api/public/bookings/${encodeURIComponent(bookingId)}/cancel`, { method: "POST", body: JSON.stringify({ code }) }, BOOKING_FALLBACKS);
}

/** The link a patient opens to follow their token. Works on any device: the code is the key. */
export function trackingPath(bookingId: string, code: string) {
  return `/track/${encodeURIComponent(bookingId)}?code=${encodeURIComponent(code)}`;
}
