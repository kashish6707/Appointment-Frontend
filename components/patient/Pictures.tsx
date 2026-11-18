// Placeholder pictures: a drawn clinic building (when a clinic has no photo) and an initials
// avatar (when a doctor hasn't agreed to show their photo). No real people's photos.

import type { ClinicType } from "@/lib/patientApi";

/** A simple clinic or hospital building, tinted with the clinic's colour. Fills its box. */
export function ClinicArt({ colour = "#1F7A55", type = "CLINIC" }: { colour?: string; type?: ClinicType }) {
  const hospital = type === "HOSPITAL";
  return (
    <svg viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <rect width="400" height="230" fill="#EAF6EF" />
      <circle cx="330" cy="52" r="26" fill="#FFFFFF" opacity="0.8" />
      <path d="M0 196h400v34H0z" fill="#D6E4DC" />
      <rect x={hospital ? 110 : 130} y={hospital ? 62 : 92} width={hospital ? 180 : 140} height={hospital ? 134 : 104} rx="6" fill={colour} />
      {!hospital && <path d="M118 96 200 52l82 44z" fill={colour} opacity="0.85" />}
      {hospital && <rect x="110" y="56" width="180" height="12" rx="4" fill={colour} opacity="0.85" />}
      <rect x="182" y={hospital ? 76 : 104} width="36" height="36" rx="6" fill="#FFFFFF" />
      <rect x="196" y={hospital ? 82 : 110} width="8" height="24" rx="2" fill={colour} />
      <rect x="188" y={hospital ? 90 : 118} width="24" height="8" rx="2" fill={colour} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={hospital ? 128 + i * 52 : 146 + i * 40} y={hospital ? 128 : 150} width="26" height="20" rx="3" fill="#FFFFFF" opacity="0.85" />
      ))}
      <rect x="186" y="166" width="28" height="30" rx="3" fill="#FFFFFF" />
      <circle cx="70" cy="170" r="22" fill="#1F7A55" opacity="0.25" />
      <rect x="67" y="170" width="6" height="26" fill="#145C3F" opacity="0.4" />
    </svg>
  );
}

/** The doctor's photo if they agreed to show it, otherwise their initials. */
export function Avatar({ name, initials, photoUrl, size = 64 }: { name: string; initials: string; photoUrl?: string | null; size?: number }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover ring-2 ring-white" style={{ width: size, height: size }} />;
  }
  return (
    <span
      aria-hidden="true"
      title={name}
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-light font-bold text-brand-dark ring-2 ring-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </span>
  );
}
