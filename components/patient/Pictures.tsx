// Placeholder pictures, until a clinic adds its own photo: a scene for the clinic's main
// department, or a drawn building (hospitals, or an unknown department). And an initials avatar
// for a doctor without a photo. All drawn here: no stock images, nothing to license.

import type { ClinicType } from "@/lib/patientApi";
import { DepartmentIcon } from "./icons";

/** Each department's icon and colours: background, soft shapes, and the icon/accent colour. */
const DEPARTMENT_ART: Record<string, { icon: string; bg: string; blob: string; accent: string }> = {
  general_medicine: { icon: "stethoscope", bg: "#EAF6EF", blob: "#CDE9D9", accent: "#1F7A55" },
  gynaecology: { icon: "female", bg: "#FDEFF4", blob: "#F8D2E0", accent: "#C2185B" },
  paediatrics: { icon: "baby", bg: "#FFF7E3", blob: "#FCE5A9", accent: "#B7791F" },
  orthopaedics: { icon: "bone", bg: "#EBF3FC", blob: "#CFE1F6", accent: "#2B6CB0" },
  cardiology: { icon: "heart", bg: "#FDEDED", blob: "#F8CFCF", accent: "#C53030" },
  dermatology: { icon: "skin", bg: "#FFF2E9", blob: "#FBD9C3", accent: "#C05621" },
  ent: { icon: "ear", bg: "#E7F6F6", blob: "#C4E9E9", accent: "#2C7A7B" },
  ophthalmology: { icon: "eye", bg: "#EEF0FC", blob: "#D4D9F6", accent: "#434190" },
  neurology: { icon: "brain", bg: "#F4EFFC", blob: "#DED2F6", accent: "#6B46C1" },
  psychiatry: { icon: "mind", bg: "#F6F0FB", blob: "#E3D5F3", accent: "#805AD5" },
  general_surgery: { icon: "scalpel", bg: "#EEF2F7", blob: "#D6DEE9", accent: "#2D3748" },
  urology: { icon: "kidney", bg: "#E8F6FA", blob: "#C8E6F1", accent: "#0B7285" },
  gastroenterology: { icon: "stomach", bg: "#FFF4E6", blob: "#FBDDB7", accent: "#B45309" },
  dentistry: { icon: "tooth", bg: "#EAF6FD", blob: "#CCE8F8", accent: "#0369A1" },
  oncology: { icon: "ribbon", bg: "#FCEFF5", blob: "#F4D0E0", accent: "#9D174D" },
  pulmonology: { icon: "lungs", bg: "#E9F7F4", blob: "#C7EBE3", accent: "#0F766E" },
  endocrinology: { icon: "drop", bg: "#F2F8E9", blob: "#DCEEC6", accent: "#4D7C0F" },
};

/** The picture for a clinic without a photo: its main department's scene if there is one
 *  (not for hospitals, which have many), else the building. Fills its box. */
export function ClinicPlaceholder({ departmentKey, type = "CLINIC", colour }: { departmentKey?: string | null; type?: ClinicType; colour?: string }) {
  if (type !== "HOSPITAL" && departmentKey && DEPARTMENT_ART[departmentKey]) return <DepartmentArt departmentKey={departmentKey} />;
  return <ClinicArt colour={colour} type={type} />;
}

/** A soft scene for one department: its icon large in a white badge, with a few shapes around. */
export function DepartmentArt({ departmentKey }: { departmentKey: string }) {
  const a = DEPARTMENT_ART[departmentKey] ?? DEPARTMENT_ART.general_medicine;
  const plus = (x: number, y: number, s: number, o: number) => (
    <g transform={`translate(${x} ${y})`} fill={a.accent} opacity={o}>
      <rect x={-s / 2} y={-s / 6} width={s} height={s / 3} rx={s / 6} />
      <rect x={-s / 6} y={-s / 2} width={s / 3} height={s} rx={s / 6} />
    </g>
  );
  return (
    <svg viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <rect width="400" height="230" fill={a.bg} />
      <path d="M232 -20c70 0 150 30 168 96v170H210c-52-18-70-62-56-112 12-44 22-154 78-154Z" fill={a.blob} />
      <circle cx="58" cy="44" r="46" fill={a.blob} opacity="0.55" />
      <circle cx="96" cy="196" r="20" fill="#FFFFFF" opacity="0.7" />
      <circle cx="200" cy="115" r="86" fill="none" stroke={a.accent} strokeOpacity="0.18" strokeWidth="2" strokeDasharray="4 8" />
      <circle cx="200" cy="121" r="62" fill={a.accent} opacity="0.12" />
      <circle cx="200" cy="115" r="62" fill="#FFFFFF" />
      <g transform="translate(164 79)" style={{ color: a.accent }}>
        <DepartmentIcon iconKey={a.icon} size={72} />
      </g>
      {plus(70, 108, 22, 0.3)}
      {plus(328, 58, 16, 0.35)}
      {plus(318, 186, 26, 0.22)}
      <g transform="rotate(-30 112 72)">
        <rect x="96" y="64" width="34" height="16" rx="8" fill="#FFFFFF" />
        <path d="M113 64h9a8 8 0 0 1 0 16h-9Z" fill={a.accent} opacity="0.55" />
      </g>
      <circle cx="292" cy="112" r="5" fill={a.accent} opacity="0.3" />
      <circle cx="132" cy="160" r="4" fill={a.accent} opacity="0.3" />
      <circle cx="268" cy="36" r="3" fill={a.accent} opacity="0.35" />
    </svg>
  );
}

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
