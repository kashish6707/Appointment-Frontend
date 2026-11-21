// Doctor dashboard API: types match the backend (Appointment-Backend README, "Doctor dashboard").
// Every call goes to /api/* on this site; next.config.mjs forwards it with the session cookie.

import { request, type DegreeInput, type ProfileInput } from "./api";

// --- types -------------------------------------------------------------------------

export type SessionStatus = "NOT_STARTED" | "IN_OPD" | "ON_BREAK" | "CLOSED";
export type BookingStatus = "WAITING" | "WITH_DOCTOR" | "DONE" | "SENT_FOR_TESTS" | "NO_SHOW" | "CANCELLED";
export type VisitType = "NEW" | "FOLLOW_UP" | "REPORT_REVIEW";
export type BookingSource = "ONLINE" | "WALK_IN";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export type ClinicSlot = {
  doctorClinicId: string;
  clinicId: string;
  name: string;
  area: string;
  address: string;
  phone: string | null;
  fee: number;
  tokenAmount: number;
  opdDays: string[];
  opdStart: string; // "HH:MM", Asia/Kolkata
  opdEnd: string;
};

export type DoctorProfile = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  department: string | null;
  qualification: string | null;
  experienceYears: number | null;
  registrationNo: string | null;
  verified: boolean;
  photoUrl: string | null;
  /** False for accounts made before the full profile was required at registration. */
  profileComplete: boolean;
  /** End of the free trial (ISO). Only sent to the doctor, not staff. */
  trialEndsAt?: string | null;
  clinics: ClinicSlot[];
};

export type OpdSession = {
  id: string;
  doctorClinicId: string;
  date: string; // YYYY-MM-DD
  status: SessionStatus;
  startedAt: string | null;
  closedAt: string | null; // when End OPD was pressed; null while open
  breakStartedAt: string | null;
  breakUntil: string | null; // while ON_BREAK: when the doctor said they'd be back
  currentToken: number | null;
};

/** As this doctor sees them: `corrected` means the doctor's team corrected name, age or gender. */
export type PatientBasic = { id: string; name: string; phone: string | null; age: number; gender: Gender; corrected: boolean };

export type Booking = {
  id: string;
  sessionId: string;
  doctorClinicId: string;
  token: number;
  /** The hour the patient chose ("10:00"), when the clinic limits tokens per hour. */
  slotStart?: string | null;
  /** Minutes this patient will need with the doctor, when set (else the clinic's usual time). */
  consultMinutes?: number | null;
  status: BookingStatus;
  visitType: VisitType;
  source: BookingSource;
  bookedAt: string;
  calledAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: "PATIENT" | "CLINIC" | null;
  cancelReason: string | null;
  patient: PatientBasic;
};

export type DayStats = {
  booked: number;
  online: number;
  walkIn: number;
  waiting: number;
  withDoctor: number;
  seen: number;
  sentForTests: number;
  noShow: number;
  cancelled: number;
};

/** A date's OPD: from the weekly hours, or a day off / different hours set for that date. */
export type DayPlan = {
  date: string;
  open: boolean;
  start: string | null; // "HH:MM"
  end: string | null;
  limit: number | null; // most tokens that day; null = no limit
  note: string | null;
  exception: "CLOSED" | "HOURS" | null;
};

export type Dashboard = {
  date: string;
  clinic: ClinicSlot;
  isOpdDay: boolean;
  plan: DayPlan;
  session: OpdSession | null;
  /** Roughly when each waiting patient's turn comes, moving with breaks: { bookingId: "HH:MM" }. */
  expected: Record<string, string>;
  /** How the "OPD has started" messages to patients went. */
  notifications: NotificationSummary | null;
  stats: DayStats;
  bookings: Booking[]; // not cancelled, by token
  cancelled: Booking[]; // newest first
};

export type CalendarDay = {
  date: string;
  bookings: number;
  isOpdDay: boolean;
  sessionStatus: SessionStatus | null;
  closed: boolean;
  limit: number | null;
  exception: "CLOSED" | "HOURS" | null;
  note: string | null;
};
export type CalendarMonth = { month: string; doctorClinicId: string; days: CalendarDay[] };

export type SearchResult = Booking & { date: string; clinicName: string };

export type TestAdvice = {
  id: string;
  bookingId: string;
  name: string;
  advisedOn: string;
  status: "PENDING" | "DONE";
  recordId: string | null;
};

export type MedicalRecord = {
  id: string;
  kind: "PRESCRIPTION" | "REPORT";
  title: string;
  date: string;
  addedBy: "PATIENT" | "CLINIC";
  contentType: string;
  fileUrl: string;
};

export type BookingDetail = {
  booking: SearchResult;
  session: OpdSession;
  queuePosition: number | null;
  expectedAt: string | null; // "HH:MM", for a waiting patient
  patient: PatientBasic & { heightCm: number | null; weightKg: number | null };
  correction: { updatedBy: string; updatedAt: string; original: { name: string; age: number; gender: Gender } } | null;
  recordsConsent: boolean;
  canViewRecords: boolean;
  recordsConsentAt: string | null;
  tests: TestAdvice[];
  records: MedicalRecord[];
  /** What the patient wrote in their account profile; only with their consent. */
  health: PatientHealth | null;
};

export type PatientHealth = {
  bloodGroup: string | null;
  allergies: string | null;
  conditions: string | null;
  surgeries: string | null;
  medicines: string | null;
  emergencyContact: { name: string | null; relation: string | null; phone: string | null } | null;
  updatedAt: string | null;
};

export type NotificationSummary = { pending: number; sent: number; failed: number; skipped: number };

export type QueueResult = {
  session: OpdSession;
  notified?: number; // start: messages queued for waiting patients
  notifications?: NotificationSummary;
  finished?: Booking | null;
  current?: Booking | null;
  restored?: Booking[]; // reopen: the patient End OPD had marked as seen, back with the doctor
};

export type WalkInInput = { name: string; age: number; gender: Gender; phone?: string; visitType?: VisitType; overLimit?: boolean; whatsapp?: boolean };

// --- who is signed in, and staff access -------------------------------------------------

export type Permission =
  | "queue.view" | "queue.call" | "opd.manage" | "walkins.add"
  | "bookings.outcome" | "tests.manage" | "records.view" | "patients.correct" | "schedule.manage";
export type StaffRole = "RECEPTIONIST" | "COMPOUNDER";

export type Viewer = {
  type: "DOCTOR" | "STAFF"; // DOCTOR is root: every permission
  id: string;
  fullName: string;
  role: StaffRole | null;
  permissions: Permission[];
};
export type Workplace = { doctorId: string; doctorName: string; role: StaffRole };
export type Me = { viewer: Viewer; workplaces: Workplace[]; doctor: DoctorProfile | null };

export type StaffMember = {
  id: string; // the grant (membership) id
  staffId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  role: StaffRole;
  permissions: Permission[];
  doctorClinicIds: string[];
  status: "INVITED" | "INVITE_EXPIRED" | "ACTIVE";
  inviteExpiresAt: string | null;
  addedAt: string;
};
export type StaffList = {
  staff: StaffMember[];
  permissions: { key: Permission; label: string }[];
  presets: Record<StaffRole, Permission[]>;
};
export type StaffInput = {
  fullName: string;
  phone?: string;
  email?: string;
  role: StaffRole;
  permissions: Permission[];
  doctorClinicIds: string[];
};
export type ActivityEntry = {
  id: number;
  at: string;
  actorKind: "DOCTOR" | "STAFF";
  actorName: string;
  action: string;
  target: string | null;
  detail: Record<string, unknown> | null;
};
export type InviteDetails = { fullName: string; phone: string | null; email: string | null; doctors: string[]; expiresAt: string };

// --- reads (used as SWR keys: the key is the URL) ---------------------------------------

function query(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const keys = {
  me: "/api/doctor/me",
  dashboard: (date: string, doctorClinicId?: string) => `/api/doctor/dashboard${query({ date, doctorClinicId })}`,
  calendar: (month: string, doctorClinicId?: string) => `/api/doctor/calendar${query({ month, doctorClinicId })}`,
  search: (q: string, date: string, doctorClinicId?: string) => `/api/doctor/search${query({ q, date, doctorClinicId })}`,
  booking: (id: string) => `/api/doctor/bookings/${id}`,
  staff: "/api/doctor/staff",
  profile: "/api/doctor/profile",
  schedule: (doctorClinicId: string) => `/api/doctor/clinics/${doctorClinicId}/schedule`,
  activity: (staffId?: string) => `/api/doctor/activity${query({ staffId, limit: "50" })}`,
};

/** SWR fetcher: GET the key. */
export const fetcher = <T,>(url: string) => request<T>(url);

// --- writes ----------------------------------------------------------------------------

const post = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });

export type SessionAction = "start" | "pause" | "resume" | "end" | "reopen" | "next";

export const sessionAction = (sessionId: string, action: SessionAction, body?: { minutes: number }) =>
  post<QueueResult>(`/api/doctor/sessions/${sessionId}/${action}`, body);

/** Take a break of `minutes`; waiting patients' expected times move by it. */
export const startBreak = (sessionId: string, minutes: number) => sessionAction(sessionId, "pause", { minutes });

export const extendBreak = (sessionId: string, minutes: number) =>
  post<QueueResult>(`/api/doctor/sessions/${sessionId}/break/extend`, { minutes });

export const callPatient = (bookingId: string) => post<QueueResult>(`/api/doctor/bookings/${bookingId}/call`);

/** How long this patient will need (null: the usual time). Later patients' expected times move. */
export const setConsultMinutes = (bookingId: string, minutes: number | null) =>
  request<Booking>(`/api/doctor/bookings/${bookingId}/consult-minutes`, { method: "PUT", body: JSON.stringify({ minutes }) });

export const setBookingStatus = (bookingId: string, status: "DONE" | "SENT_FOR_TESTS" | "NO_SHOW") =>
  request<Booking>(`/api/doctor/bookings/${bookingId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const sendForTests = (bookingId: string, names: string[]) =>
  post<{ booking: Booking; tests: TestAdvice[] }>(`/api/doctor/bookings/${bookingId}/tests`, { names });

export const setTestStatus = (testId: string, status: "PENDING" | "DONE") =>
  request<TestAdvice>(`/api/doctor/tests/${testId}`, { method: "PATCH", body: JSON.stringify({ status }) });

export const addWalkIn = (sessionId: string, input: WalkInInput) =>
  post<{ booking: Booking; trackingCode: string }>(`/api/doctor/sessions/${sessionId}/walk-ins`, input);

// --- local updates (live events and optimistic changes) ---------------------------------

export function computeStats(bookings: Booking[], cancelled: Booking[]): DayStats {
  const count = (s: BookingStatus) => bookings.filter((b) => b.status === s).length;
  return {
    booked: bookings.length,
    online: bookings.filter((b) => b.source === "ONLINE").length,
    walkIn: bookings.filter((b) => b.source === "WALK_IN").length,
    waiting: count("WAITING"),
    withDoctor: count("WITH_DOCTOR"),
    seen: count("DONE"),
    sentForTests: count("SENT_FOR_TESTS"),
    noShow: count("NO_SHOW"),
    cancelled: cancelled.length,
  };
}

/** The day with one booking added or replaced (moved to "cancelled" if it was cancelled). */
export function withBooking(day: Dashboard, booking: Booking): Dashboard {
  if (!day.session || booking.sessionId !== day.session.id) return day;
  const rest = day.bookings.filter((b) => b.id !== booking.id);
  const restCancelled = day.cancelled.filter((b) => b.id !== booking.id);
  const bookings = booking.status === "CANCELLED" ? rest : [...rest, booking].sort((a, b) => a.token - b.token);
  const cancelled = booking.status === "CANCELLED" ? [booking, ...restCancelled] : restCancelled;
  return { ...day, bookings, cancelled, stats: computeStats(bookings, cancelled) };
}

export function withSession(day: Dashboard, session: OpdSession): Dashboard {
  return day.session?.id === session.id ? { ...day, session } : day;
}

export type CorrectionInput = { name?: string; age?: number; gender?: Gender; heightCm?: number | null; weightKg?: number | null };

export const correctPatient = (bookingId: string, input: CorrectionInput) =>
  request<BookingDetail>(`/api/doctor/bookings/${bookingId}/patient`, { method: "PATCH", body: JSON.stringify(input) });

// --- staff access (doctor only) ----------------------------------------------------------

export const addStaff = (input: StaffInput) => post<{ member: StaffMember; inviteUrl: string | null }>("/api/doctor/staff", input);

export const updateStaff = (id: string, input: Partial<Pick<StaffInput, "role" | "permissions" | "doctorClinicIds">>) =>
  request<StaffMember>(`/api/doctor/staff/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const removeStaff = (id: string) => request<object>(`/api/doctor/staff/${id}`, { method: "DELETE" });

export const newInviteLink = (id: string) => post<{ inviteUrl: string; inviteExpiresAt: string }>(`/api/doctor/staff/${id}/invite`);

// --- staff: invites and choosing a doctor -------------------------------------------------

export const getInvite = (token: string) => request<InviteDetails>(`/api/auth/staff/invite/${encodeURIComponent(token)}`);

export const acceptInvite = (token: string, password: string) =>
  post<{ staff: { id: string; fullName: string } }>(`/api/auth/staff/invite/${encodeURIComponent(token)}`, { password });

export const chooseWorkplace = (doctorId: string) => post<object>("/api/auth/staff/workplace", { doctorId });

// --- OPD timings (doctor, or staff with schedule.manage) ------------------------------------

export const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export type WeeklyDay = { weekday: Weekday; open: boolean; start: string | null; end: string | null; limit: number | null };
export type DateException = {
  date: string;
  kind: "CLOSED" | "HOURS";
  start: string | null;
  end: string | null;
  limit: number | null;
  note: string | null;
  createdBy: string;
};
export type Schedule = {
  clinic: ClinicSlot;
  weekly: WeeklyDay[];
  exceptions: DateException[];
  upcoming: (DayPlan & { booked: number })[];
  bookingWindowDays: number;
  /** Most tokens patients can book in each hour of OPD; null = no hourly limit. */
  tokensPerHour: number | null;
  /** How long the doctor usually takes per patient; null = measured each day. */
  minutesPerPatient: number | null;
  cancelled?: number; // after a change that cancelled bookings
  refunded?: number;
};
export type ExceptionInput = {
  from: string;
  to?: string;
  kind: "CLOSED" | "HOURS";
  start?: string;
  end?: string;
  limit?: number | null;
  note?: string;
};

/** confirmCancel: the doctor agreed to cancel (and refund) bookings on days the change takes away. */
export const saveWeekly = (doctorClinicId: string, days: WeeklyDay[], confirmCancel = false) =>
  request<Schedule>(`/api/doctor/clinics/${doctorClinicId}/weekly`, { method: "PUT", body: JSON.stringify({ days, confirmCancel }) });

export const saveTokensPerHour = (doctorClinicId: string, tokensPerHour: number | null) =>
  request<Schedule>(`/api/doctor/clinics/${doctorClinicId}/tokens-per-hour`, { method: "PUT", body: JSON.stringify({ tokensPerHour }) });

export const saveMinutesPerPatient = (doctorClinicId: string, minutesPerPatient: number | null) =>
  request<Schedule>(`/api/doctor/clinics/${doctorClinicId}/minutes-per-patient`, { method: "PUT", body: JSON.stringify({ minutesPerPatient }) });

export const addException = (doctorClinicId: string, input: ExceptionInput, confirmCancel = false) =>
  post<Schedule>(`/api/doctor/clinics/${doctorClinicId}/exceptions`, { ...input, confirmCancel });

export const removeException = (doctorClinicId: string, date: string, confirmCancel = false) =>
  request<Schedule>(`/api/doctor/clinics/${doctorClinicId}/exceptions/${date}${confirmCancel ? "?confirmCancel=true" : ""}`, { method: "DELETE" });

// --- the doctor's own profile -------------------------------------------------------------

export type OwnProfile = {
  fullName: string;
  photoUrl: string | null;
  specialisation: string | null;
  experienceYears: number | null;
  qualification: string | null;
  degrees: (DegreeInput & { institute: string | null; year: number | null })[];
  fee: number | null;
  about: string | null;
  achievements: string[];
  expertise: string[];
  verified: boolean;
  registrationNo: string | null;
  photoConsent: boolean;
  medicalCouncil: string | null;
  complete: boolean;
};

export const updateProfile = (input: ProfileInput & { fullName?: string }) =>
  request<OwnProfile>("/api/doctor/profile", { method: "PUT", body: JSON.stringify(input) });

// --- clinic photos -------------------------------------------------------------------------

export type ClinicPhoto = { id: string; large: string; small: string; width: number; height: number; addedBy: string | null };
export type ClinicDetails = { id: string; name: string; coverPhotoId: string | null; photos: ClinicPhoto[]; maxPhotos: number };

const clinicPath = (clinicId: string) => `/api/doctor/clinic-details/${clinicId}`;
export const clinicDetailsKey = clinicPath;
export const addClinicPhoto = (clinicId: string, image: string) =>
  request<ClinicDetails>(`${clinicPath(clinicId)}/photos`, { method: "POST", body: JSON.stringify({ image }) });
export const removeClinicPhoto = (clinicId: string, photoId: string) =>
  request<ClinicDetails>(`${clinicPath(clinicId)}/photos/${photoId}`, { method: "DELETE" });
export const setClinicCover = (clinicId: string, photoId: string) =>
  request<ClinicDetails>(`${clinicPath(clinicId)}/cover`, { method: "PUT", body: JSON.stringify({ photoId }) });

// --- adding a clinic ---------------------------------------------------------------------

export type NewClinic = {
  type: "CLINIC" | "HOSPITAL";
  name: string;
  address: string;
  areaKey: string;
  phone?: string;
  fee: number;
  days: string[]; // MON..SUN
  start: string; // HH:MM
  end: string;
  limit?: number | null;
};

export const addClinic = (input: NewClinic) => post<ClinicSlot>("/api/doctor/clinic-details", input);

export const getAreas = () => request<{ areas: { id: string; key: string; name: string; nameHi: string }[] }>("/api/public/areas");
