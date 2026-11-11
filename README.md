# Clinically – Frontend

Web app for **Clinically**: patients find the right doctor in Patna and book a token; doctors and compounders run the OPD queue.

Built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS 3**, **SWR** for data fetching and **socket.io-client** for live updates.

## Design

White background with green touches.

| Token | Colour | Use |
|---|---|---|
| `brand` | `#1F7A55` | Buttons, links, logo |
| `brand-dark` | `#145C3F` | Hover, headings |
| `brand-light` | `#EAF6EF` | Selected states, icon circles |
| `brand-tint` | `#F2F9F5` | Soft section backgrounds |
| `ink` | `#1D2340` | Main text |
| `muted` | `#5E6478` | Secondary text |
| `line` | `#D6E4DC` | Borders |
| `token` | `#E8A317` | Token numbers only |
| `danger` | `#B9382A` | Errors and emergency alerts only |

Fonts: **Schibsted Grotesk** for English, with **Mukta** as the Hindi fallback.

## Getting started

```bash
npm install
cp .env.example .env.local   # set API_URL to your backend
npm run dev                  # http://localhost:3000
```

## Pages

| Route | Status |
|---|---|
| `/` | Simple home page |
| `/doctor/register` | Doctor registration in two steps: account (mobile number or email + password), then professional details |
| `/doctor/profile` | Doctor only. Edit the professional profile patients see |
| `/doctor/login` | Sign in for doctors and clinic staff (mobile number or email + password) |
| `/doctor/dashboard` | Signed-in only. The OPD dashboard (see below). Staff working for several doctors choose one first |
| `/doctor/schedule` | OPD timings: weekly hours and daily limits, days off and different hours (doctor, or staff allowed to change timings) |
| `/doctor/staff` | Doctor only. Staff & access: add, change and remove staff, invite links, activity log |
| `/staff/invite/[token]` | A staff member opens the doctor's invite link and sets their password |

## Doctor profile

Registration has two steps on one page, and the account is only created after both:
1. **Account:** name, mobile number or email, password.
2. **Professional details:** photo, years of experience, degrees, consultation fee and registration number are **required**. Specialisation, medical council, specialisation & expertise, achievements and about are optional.
   - Degrees: each has a level (UG, PG, super speciality, fellowship, diploma, other), with suggestions for common Indian degrees.
   - Photo: cropped to a square and shrunk to a small JPEG in the browser (`lib/photo.ts`) before upload.

The same form (`components/ProfileFields.tsx`) is on `/doctor/profile` for later changes. Doctors who registered before these fields existed see a "Complete your profile" reminder on the dashboard. Patients see the profile once the doctor is verified; the registration number is never shown to them.

## OPD timings and daily limits

On `/doctor/schedule` the doctor sets, per clinic:
- **Weekly timings:** for each weekday, OPD on or off, start and end time, and a **daily limit** (online and walk-in tokens together; empty = no limit). The page shows roughly how many minutes that leaves per patient.
- **Not available, or different hours:** a day off, or different hours and limit, for one date or several in a row, with an optional note patients see (e.g. "Doctor at a conference").
- **What patients can book:** today and the next 7 days as patients see them.

Patients can only book open days, and online booking stops when a day is full. At the desk, a walk-in past the limit asks "Add anyway?". If a change takes away a day patients have already booked, the page says how many and asks first. Confirming cancels those bookings as "Doctor unavailable" and refunds online token payments. Before OPD starts, a patient's booking shows an expected time from the day's hours and limit. The dashboard's OPD card shows the day's real hours, any change, and how many tokens are left; the calendar marks days off ("Off"), full days, and days with changed hours (amber dot).

## Staff accounts and access

Works like AWS IAM. **The doctor is root**: they see and can do everything, and only they manage staff on `/doctor/staff`. Each receptionist or compounder has their own login, and each doctor they work for grants:
- a **role preset** (Receptionist or Compounder) that fills in permissions the doctor can then adjust,
- **permissions**: see bookings (always on), call patients in, run OPD, add walk-ins, mark seen or didn't come, tests, open prescriptions and reports, correct patient details, change OPD timings,
- **clinics**: which of the doctor's clinics the grant covers.

New staff get an **invite link** (48 hours, works once) that the doctor sends them, e.g. on WhatsApp. They set their own password. The backend checks every request against the grant. The dashboard only hides what a person can't do, and live updates only cover their clinics. When the doctor changes or removes access, the person's open dashboard reloads with the new access. Every action is in the doctor's **activity log** on the same page.

**Correcting patient details:** with permission, the patient panel's **Edit details** fixes name, age and gender for this doctor's team only, and records height and weight for this visit. The patient's own details, and what other doctors see, stay the same. The mobile number can't be changed there.

## Doctor dashboard

`/doctor/dashboard` is where a doctor runs the day's OPD at one clinic (a selector appears when they have several):

- **OPD card:** status (Not started, In OPD, On break, Closed), Start OPD / Take a break / Resume / End OPD (asks first), the amber **Now serving** token, and **Call next patient**. **Start OPD** tells every waiting patient that OPD has started; the card says how many will be told, then how the messages went (told, sending, couldn't be reached, no mobile number).
- **Stat tiles:** booked (online / walk-in), waiting, seen, sent for tests, cancelled.
- **Bookings:** filter by status; a table on tablets and up, tappable cards on phones. Clicking one opens the patient panel.
- **Calendar:** booking count per day, closed days dashed. Clicking a day loads that day. Phones get a week strip with a **Full calendar** button.
- **Cancelled** list, **Add walk-in token** form, and **patient search** (name, token number or phone) in the top bar.
- **Patient panel:** token, basic details, mobile with a Call link, tests advised (mark done / not done), previous prescriptions and reports (only with the patient's consent), and the actions Call this patient in, Send for tests, Mark as seen.
- **Live updates:** new, changed and cancelled bookings appear without a refresh, with a toast for new ones.

Data comes from `lib/doctorApi.ts` (types and calls) through SWR. Live updates use socket.io-client at `/api/socket.io`, which the same `/api/*` forwarding sends to the backend. The client connects without a trailing slash (`addTrailingSlash: false`) because Next.js redirects one away. Every dashboard string is in `lib/strings.ts`, ready for a Hindi version.

To try it locally, run the backend's demo data (`python -m scripts.seed` in Appointment-Backend) and sign in as the demo doctor from that script.

## Backend contract: doctor registration

`POST /api/auth/doctor/register`

Request body:
```json
{ "fullName": "Dr. Rajeev Anand", "method": "phone", "phone": "9876543210", "password": "secret123" }
```
or
```json
{ "fullName": "Dr. Rajeev Anand", "method": "email", "email": "rajeev@example.com", "password": "secret123" }
```

Responses:
- `201 Created` → `{ "id": "..." }`
- `400 Bad Request` → `{ "message": "..." }` (validation failed)
- `409 Conflict` → `{ "message": "..." }` (phone or email already registered)

The backend must validate again and **hash passwords** (bcrypt or argon2, never store plain text).

## How sign-in works

The browser never talks to the backend directly. It calls `/api/*` on this site, and `next.config.mjs` forwards those calls to `API_URL`. So the session cookie belongs to the frontend's own site: no CORS, and no cross-site cookie settings.

- The backend sets an **httpOnly cookie** called `clinically_session` when the doctor signs in. JavaScript in the page can't read it.
- `middleware.ts` sends anyone without that cookie from signed-in pages to `/doctor/login?next=...`.
- Signed-in pages call `getCurrentDoctor()` (`lib/session.ts`), which asks the backend `GET /api/auth/me` whether the session is still valid.

## Backend contract: sessions

**`POST /api/auth/doctor/login`**, with the same `method` / `phone` / `email` fields as registration, plus `password`:
- `200 OK` → `{ "doctor": { "id": "...", "fullName": "..." } }` and the header
  `Set-Cookie: clinically_session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`
  (leave out `Secure` on local http; don't set `Domain`)
- `401` → `{ "message": "..." }`. Use the same message for "no such account" and "wrong password".
- `429` → too many attempts (rate-limit by account and by IP)

**`GET /api/auth/me`** (reads the cookie):
- `200 OK` → `{ "doctor": { "id": "...", "fullName": "..." } }`
- `401` → not signed in, expired, or signed out

**`POST /api/auth/logout`**: delete the session on the server, then
- `204 No Content` with `Set-Cookie: clinically_session=; Path=/; Max-Age=0`

Session tokens: generate 32 random bytes, store only a **hash** of the token in a sessions table (`doctorId`, `expiresAt`), and delete the row on logout. This lets you sign a doctor out from every device. The backend should also reject POST requests whose `Content-Type` isn't `application/json`. Together with `SameSite=Lax`, that blocks cross-site form posts.

## Folder structure

```
app/
  layout.tsx            root layout, fonts
  page.tsx              home
  doctor/register/      doctor registration
  doctor/login/         doctor sign in
  doctor/dashboard/     signed-in area (placeholder)
components/             Logo, Button, TextField
components/dashboard/   dashboard pieces: top bar, OPD card, bookings, calendar, patient panel, walk-in form
lib/                    api client, doctorApi (dashboard types and calls), session check (server),
                        strings (all dashboard text), time (India dates), useLiveUpdates, validation
middleware.ts           redirects signed-out visitors away from signed-in pages
```
