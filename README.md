# Apki Bari – Frontend

Web app for **Apki Bari (आपकी बारी)**: patients find the right doctor in Patna and book a token; doctors and compounders run the OPD queue.

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
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to your backend
npm run dev                  # http://localhost:3000
```

## Pages

| Route | Status |
|---|---|
| `/` | Simple home page |
| `/doctor/register` | Doctor registration (mobile number or email + password) |
| `/doctor/login` | Placeholder, coming next |

## Backend contract: doctor registration

`POST {NEXT_PUBLIC_API_URL}/api/auth/doctor/register`

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

The backend must validate again, **hash passwords** (bcrypt or argon2, never store plain text), and allow the frontend's origin with CORS.

## Folder structure

```
app/
  layout.tsx            root layout, fonts
  page.tsx              home
  doctor/register/      doctor registration
  doctor/login/         doctor sign in (placeholder)
components/             Logo, Button, TextField
lib/                    api client, validation
```
