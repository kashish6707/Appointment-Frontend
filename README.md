# Clinically – Frontend

Web app for **Clinically**: patients find the right doctor in Patna and book a token; doctors and compounders run the OPD queue.

Built with **Next.js 15 (App Router)**, **React 19**, **TypeScript** and **Tailwind CSS 3**.

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
| `/doctor/register` | Doctor registration (mobile number or email + password) |
| `/doctor/login` | Doctor sign in (mobile number or email + password) |
| `/doctor/dashboard` | Signed-in only. Placeholder that shows the doctor's name and a Sign out button |

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
lib/                    api client (browser), session check (server), validation
middleware.ts           redirects signed-out visitors away from signed-in pages
```
