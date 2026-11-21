// Placeholder pictures, until a clinic adds its own photo: a scene for the clinic's main
// department, or a drawn building (hospitals, or an unknown department). And an initials avatar
// for a doctor without a photo. All drawn here: no stock images, nothing to license.

import { useId, type ReactNode } from "react";
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

/** A department's picture: its rich scene, or (a department without one) its icon in a white badge. */
export function DepartmentArt({ departmentKey }: { departmentKey: string }) {
  const scene = SCENES[departmentKey];
  if (scene) return <Scene palette={scene.palette} subject={scene.subject} />;
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

// --- rich department scenes ---------------------------------------------------------------
// One frame for all: a gradient sky, a glass bubble with a honeycomb pattern, a pulse line,
// sparkles and a check badge. Each department draws its own subject inside the bubble
// (centre 200,118, radius 104) in soft shaded colours.

type U = (name: string) => string;
type Palette = { top: string; mid: string; bottom: string };

const BONE = "#F4F1EA";

function radial(u: U, name: string, from: string, to: string, cx = 0.35, cy = 0.3) {
  return (
    <radialGradient id={u(name)} cx={cx} cy={cy} r="0.85">
      <stop offset="0" stopColor={from} />
      <stop offset="1" stopColor={to} />
    </radialGradient>
  );
}

function linear(u: U, name: string, from: string, to: string, vertical = false) {
  return (
    <linearGradient id={u(name)} x1="0" y1="0" x2={vertical ? "0" : "1"} y2={vertical ? "1" : "0"}>
      <stop offset="0" stopColor={from} />
      <stop offset="1" stopColor={to} />
    </linearGradient>
  );
}

const url = (u: U, name: string) => `url(#${u(name)})`;

function sparkle(x: number, y: number, r: number) {
  const k = r * 0.12;
  return (
    <path key={`${x}-${y}`} transform={`translate(${x} ${y})`} fill="#FFFFFF"
      d={`M0 ${-r}C${k} ${-k} ${k} ${-k} ${r} 0C${k} ${k} ${k} ${k} 0 ${r}C${-k} ${k} ${-k} ${k} ${-r} 0C${-k} ${-k} ${-k} ${-k} 0 ${-r}Z`} />
  );
}

const HEART = "M200 172C160 146 140 122 140 98C140 78 156 66 172 66C186 66 196 74 200 84C204 74 214 66 228 66C244 66 260 78 260 98C260 122 240 146 200 172Z";

function Scene({ palette, subject }: { palette: Palette; subject: (u: U) => ReactNode }) {
  const id = useId().replace(/:/g, "");
  const u: U = (name) => `${name}-${id}`;
  return (
    <svg viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={u("sky")} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={palette.top} />
          <stop offset="0.6" stopColor={palette.mid} />
          <stop offset="1" stopColor={palette.bottom} />
        </linearGradient>
        <radialGradient id={u("glass")} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0.06" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.2" />
        </radialGradient>
        <radialGradient id={u("badge")} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={palette.mid} />
          <stop offset="1" stopColor={palette.top} />
        </radialGradient>
        <pattern id={u("hex")} width="18" height="31.2" patternUnits="userSpaceOnUse">
          <path d="M9 0l9 5.2v10.4l-9 5.2-9-5.2V5.2zM9 20.8v10.4M0 15.6l-9 5.2M18 15.6l9 5.2" fill="none" stroke="#FFFFFF" strokeOpacity="0.16" strokeWidth="1" />
        </pattern>
        <clipPath id={u("ball")}><circle cx="200" cy="118" r="104" /></clipPath>
      </defs>
      <rect width="400" height="230" fill={url(u, "sky")} />
      <circle cx="200" cy="118" r="104" fill={url(u, "glass")} />
      <rect width="400" height="230" fill={url(u, "hex")} clipPath={url(u, "ball")} />
      <path d="M0 150h52l7-20 9 36 7-24 5 8h40" fill="none" stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <g clipPath={url(u, "ball")}>{subject(u)}</g>
      <circle cx="200" cy="118" r="104" fill="none" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="2" />
      <path d="M258 36a96 96 0 0 1 40 50" fill="none" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="5" strokeLinecap="round" />
      {sparkle(262, 60, 7)}
      {sparkle(140, 70, 5)}
      {sparkle(330, 40, 4)}
      <circle cx="292" cy="190" r="22" fill={url(u, "badge")} stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="1.5" />
      <path d="M282 190l7 7 14-14" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SCENES: Record<string, { palette: Palette; subject: (u: U) => ReactNode }> = {
  general_medicine: {
    palette: { top: "#16654A", mid: "#2F9E70", bottom: "#B4EACF" },
    subject: (u) => (
      <g>
        <defs>{radial(u, "metal", "#FFFFFF", "#A9B7C2")}</defs>
        <path d="M176 46c0 24 10 40 24 46M224 46c0 24-10 40-24 46M200 92c0 28 0 46 16 56 18 12 34 2 34-16" fill="none" stroke="#2F3B45" strokeWidth="7" strokeLinecap="round" />
        <path d="M200 92c0 28 0 46 16 56 18 12 34 2 34-16" fill="none" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
        <circle cx="176" cy="44" r="6" fill="#2F3B45" />
        <circle cx="224" cy="44" r="6" fill="#2F3B45" />
        <circle cx="250" cy="128" r="20" fill={url(u, "metal")} stroke="#8796A3" strokeWidth="1.5" />
        <circle cx="250" cy="128" r="11" fill="#E8EDF1" stroke="#95A3AE" strokeWidth="2" />
        <ellipse cx="243" cy="120" rx="5" ry="3" fill="#FFFFFF" opacity="0.9" />
        {sparkle(170, 150, 8)}
      </g>
    ),
  },
  gynaecology: {
    palette: { top: "#A3154F", mid: "#DD5A93", bottom: "#F9CADD" },
    subject: (u) => (
      <g>
        <defs>{radial(u, "pink", "#FFE0EB", "#E8578C")}</defs>
        <path d="M172 94c-16-8-27-4-33 8M228 94c16-8 27-4 33 8" fill="none" stroke={url(u, "pink")} strokeWidth="8" strokeLinecap="round" />
        <circle cx="136" cy="108" r="8" fill="#F48FB1" />
        <circle cx="264" cy="108" r="8" fill="#F48FB1" />
        <ellipse cx="152" cy="124" rx="9" ry="7" fill="#F8BBD0" />
        <ellipse cx="248" cy="124" rx="9" ry="7" fill="#F8BBD0" />
        <path d="M168 96c0-14 64-14 64 0 0 24-16 44-24 54h-16c-8-10-24-30-24-54z" fill={url(u, "pink")} />
        <rect x="191" y="146" width="18" height="26" rx="8" fill="#E8578C" />
        <path d="M186 100h28l-14 28z" fill="#FFE4EE" opacity="0.75" />
        <path d="M176 94c2-6 8-8 14-8" fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />
        {sparkle(236, 80, 8)}
      </g>
    ),
  },
  paediatrics: {
    palette: { top: "#C9701A", mid: "#F2B23E", bottom: "#FFE8AB" },
    subject: (u) => (
      <g>
        <defs>{radial(u, "skin", "#FFEBDA", "#F2B48C")}</defs>
        <circle cx="148" cy="118" r="11" fill={url(u, "skin")} />
        <circle cx="252" cy="118" r="11" fill={url(u, "skin")} />
        <circle cx="200" cy="116" r="54" fill={url(u, "skin")} />
        <ellipse cx="180" cy="86" rx="16" ry="9" fill="#FFFFFF" opacity="0.35" />
        <path d="M196 64c-6-10 8-16 12-8 2 6-6 8-8 4" fill="none" stroke="#8B5A2B" strokeWidth="4" strokeLinecap="round" />
        <path d="M176 112q8-8 16 0M208 112q8-8 16 0" fill="none" stroke="#6B4226" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="170" cy="130" rx="10" ry="6" fill="#F48FB1" opacity="0.55" />
        <ellipse cx="230" cy="130" rx="10" ry="6" fill="#F48FB1" opacity="0.55" />
        <path d="M188 138q12 10 24 0" fill="none" stroke="#6B4226" strokeWidth="3.5" strokeLinecap="round" />
        {sparkle(248, 80, 8)}
      </g>
    ),
  },
  orthopaedics: {
    palette: { top: "#2452B8", mid: "#3C86D6", bottom: "#8EDDEB" },
    subject: (u) => (
      <g>
        <defs>
          {linear(u, "bone", "#FFFFFF", "#D9D3C6")}
          <radialGradient id={u("glow")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M231 152c6 1 9 7 8 15l-2 70h-10l-1-70c-1-8 0-14 5-15z" fill={url(u, "bone")} opacity="0.92" />
        <path d="M186-10h28l1 66c1 13 21 16 30 29 9 13 4 32-10 36-11 3-22-4-30-2h-12c-8-2-19 5-30 2-14-4-19-23-10-36 9-13 29-16 30-29z" fill={url(u, "bone")} />
        <path d="M160 129c10-4 30-2 40-2 12 0 30-3 40 1 9 4 5 18-7 25-8 4-14 10-16 24l-2 63h-28l-2-63c-2-14-8-20-16-24-12-7-18-21-9-24z" fill={url(u, "bone")} />
        <path d="M204 84c11 0 17 9 16 20-1 12-8 20-17 20-10 0-16-9-15-21 1-11 7-19 16-19z" fill={url(u, "bone")} stroke="#D2CBBD" strokeOpacity="0.6" />
        <ellipse cx="200" cy="124" rx="40" ry="3.5" fill={url(u, "glow")} />
        {sparkle(240, 84, 9)}
        {sparkle(158, 126, 7)}
      </g>
    ),
  },
  cardiology: {
    palette: { top: "#9E1A1A", mid: "#DE4148", bottom: "#FFC6C6" },
    subject: (u) => (
      <g>
        <defs>{radial(u, "heart", "#FF9A9A", "#C62828")}</defs>
        <path d={HEART} fill={url(u, "heart")} />
        <path d="M160 88c2-10 12-14 20-12" fill="none" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="5" strokeLinecap="round" />
        <path d="M150 118h26l8-18 10 38 8-28 6 8h42" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {sparkle(246, 76, 8)}
      </g>
    ),
  },
  dermatology: {
    palette: { top: "#A84A17", mid: "#E9874F", bottom: "#FFDCC4" },
    subject: () => {
      const bands: [number, number, string, string][] = [[0, 8, "#F2A983", "#E39570"], [8, 30, "#F08A8A", "#DB7474"], [30, 48, "#FFD978", "#EEC45C"]];
      return (
        <g>
          <path d="M140 96 200 72l60 24-60 24z" fill="#F9C7A6" />
          {bands.map(([a, b, l, r]) => (
            <g key={a}>
              <path d={`M140 ${96 + a}L200 ${120 + a}L200 ${120 + b}L140 ${96 + b}Z`} fill={l} />
              <path d={`M200 ${120 + a}L260 ${96 + a}L260 ${96 + b}L200 ${120 + b}Z`} fill={r} />
            </g>
          ))}
          {[[156, 140], [176, 148], [222, 148], [242, 140]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="5" fill="#FFE9A8" />)}
          <path d="M180 92l-4-14M216 98l2-14M200 84l1-14" stroke="#8B5A2B" strokeWidth="2" strokeLinecap="round" />
          <path d="M252 52s-12 14-12 22a12 12 0 0 0 24 0c0-8-12-22-12-22z" fill="#FFFFFF" opacity="0.9" />
          {sparkle(160, 76, 7)}
        </g>
      );
    },
  },
  ent: {
    palette: { top: "#0F5F60", mid: "#2A9F9C", bottom: "#B6EEE9" },
    subject: (u) => (
      <g>
        <defs>{radial(u, "skin", "#FFE6D5", "#E9A585")}</defs>
        <path d="M204 64c38-4 64 24 58 54-4 24-22 32-28 48-5 14-22 22-36 16-14-6-16-22-8-32-16-10-26-30-22-50 4-22 18-34 36-36z" fill={url(u, "skin")} />
        <path d="M210 84c22 0 34 16 30 34-3 14-16 18-22 30M200 108c8-4 18 2 16 12" fill="none" stroke="#C97F62" strokeWidth="6" strokeLinecap="round" />
        <path d="M150 100q-10 18 0 36M136 92q-14 26 0 52" fill="none" stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="3.5" strokeLinecap="round" />
        {sparkle(246, 76, 7)}
      </g>
    ),
  },
  ophthalmology: {
    palette: { top: "#29267A", mid: "#5559CC", bottom: "#C9CCF7" },
    subject: (u) => (
      <g>
        <defs>
          {radial(u, "white", "#FFFFFF", "#DDE1F3", 0.5, 0.4)}
          {radial(u, "iris", "#8EC0FF", "#2A48A8", 0.4, 0.35)}
        </defs>
        <path d="M136 118c24-36 104-36 128 0-24 36-104 36-128 0z" fill={url(u, "white")} />
        <circle cx="200" cy="118" r="30" fill={url(u, "iris")} />
        <circle cx="200" cy="118" r="13" fill="#0F1630" />
        <circle cx="210" cy="108" r="6" fill="#FFFFFF" />
        <circle cx="192" cy="128" r="3" fill="#FFFFFF" opacity="0.7" />
        <path d="M136 118c24-36 104-36 128 0" fill="none" stroke="#1E1B5E" strokeWidth="4" strokeLinecap="round" />
        <path d="M160 96l-6-10M180 88l-3-11M200 86v-12M220 88l3-11M240 96l6-10" stroke="#1E1B5E" strokeWidth="3" strokeLinecap="round" />
      </g>
    ),
  },
  neurology: {
    palette: { top: "#432591", mid: "#7A54D3", bottom: "#DCCBFA" },
    subject: (u) => (
      <g>
        <defs>{radial(u, "brain", "#FFD3E7", "#D8739F")}</defs>
        <path d="M218 150c0 14-4 26-8 36" fill="none" stroke="#C25F8E" strokeWidth="12" strokeLinecap="round" />
        <ellipse cx="236" cy="148" rx="17" ry="11" fill="#C96A97" />
        <path d="M146 124c-10-28 14-58 50-58 36-4 66 18 64 46 6 20-12 38-32 36-8 12-28 12-36 2-16 6-40-2-46-26z" fill={url(u, "brain")} />
        <path d="M170 92c10-8 22-4 26 6M204 76c10 10 24 6 30 16M160 116c12-8 26-2 24 10M206 104c14-6 30 2 34 14M196 132c10-8 26-2 26 8" fill="none" stroke="#B4507F" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="180" cy="82" rx="14" ry="7" fill="#FFFFFF" opacity="0.35" />
        {sparkle(150, 84, 7)}
      </g>
    ),
  },
  psychiatry: {
    palette: { top: "#4F3596", mid: "#9476DD", bottom: "#E8DDFB" },
    subject: (u) => (
      <g>
        <defs>
          {radial(u, "head", "#FFFFFF", "#CDBDF1")}
          {radial(u, "heart", "#FF9EC4", "#D81B60")}
        </defs>
        <path d="M172 186v-26c-22-10-30-32-26-54 4-26 26-44 54-44 32 0 54 22 54 48 0 8 8 18 12 24 2 4-2 6-8 6v10c0 10-8 14-18 12h-8v24z" fill={url(u, "head")} />
        <path d={HEART} fill={url(u, "heart")} transform="translate(124 66) scale(0.38)" />
        <path d="M168 72c10-6 22-8 32-6" fill="none" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="4" strokeLinecap="round" />
        {sparkle(232, 84, 7)}
        {sparkle(170, 132, 5)}
      </g>
    ),
  },
  general_surgery: {
    palette: { top: "#26364F", mid: "#4A6894", bottom: "#C7D6EA" },
    subject: (u) => (
      <g>
        <defs>
          {linear(u, "handle", "#F2F5F8", "#8E9CAA", true)}
          {linear(u, "blade", "#FFFFFF", "#BCC7D2", true)}
        </defs>
        <g transform="rotate(-40 200 112)">
          <rect x="138" y="104" width="78" height="17" rx="7" fill={url(u, "handle")} />
          <path d="M150 108v9M160 108v9M170 108v9M180 108v9" stroke="#7D8B99" strokeWidth="2" strokeLinecap="round" />
          <path d="M214 105h48c10 0 16 6 6 14l-54 6z" fill={url(u, "blade")} stroke="#8E9CAA" strokeWidth="1" />
        </g>
        <path d="M148 172c26 14 78 14 104 0" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
        <path d="M162 170l6 10M184 174l4 10M210 175l-1 10M234 172l-4 10" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="2.5" strokeLinecap="round" />
        {sparkle(248, 70, 8)}
      </g>
    ),
  },
  urology: {
    palette: { top: "#0A5566", mid: "#1A94AE", bottom: "#BDEBF3" },
    subject: (u) => {
      const kidney = "M170 76c-20 0-30 20-28 36 2 20 16 32 30 30 10-2 10-12 6-20s-2-16 4-22c8-8 4-24-12-24z";
      return (
        <g>
          <defs>{radial(u, "kidney", "#FFA39A", "#B23B3B")}</defs>
          <path d="M178 120c8 22 14 42 18 56M222 120c-8 22-14 42-18 56" fill="none" stroke="#F2B0A8" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="200" cy="182" rx="17" ry="11" fill="#F2B6AE" />
          <path d={kidney} fill={url(u, "kidney")} />
          <path d={kidney} fill={url(u, "kidney")} transform="translate(400 0) scale(-1 1)" />
          <path d="M156 92c4-8 10-10 16-10M244 92c-4-8-10-10-16-10" fill="none" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" />
          {sparkle(200, 76, 7)}
        </g>
      );
    },
  },
  gastroenterology: {
    palette: { top: "#94420A", mid: "#DB7629", bottom: "#FFD9B2" },
    subject: (u) => (
      <g>
        <defs>{radial(u, "stomach", "#FFC2CD", "#DC5C78")}</defs>
        <path d="M206 50c0 18 2 28 6 36M156 142c-10 8-12 20-4 28" fill="none" stroke="#E58A9A" strokeWidth="13" strokeLinecap="round" />
        <path d="M212 84c28-2 50 20 46 50-4 30-32 48-62 44-26-4-44-18-46-32-2-10 6-16 16-12 12 6 24 12 38 6 14-6 16-22 8-36-6-10-8-18 0-20z" fill={url(u, "stomach")} />
        <path d="M228 108c8 8 10 20 6 32M200 160c14 0 26-6 34-16" fill="none" stroke="#C94A66" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
        <path d="M222 92c10 2 18 8 22 16" fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />
        {sparkle(160, 98, 7)}
      </g>
    ),
  },
  dentistry: {
    palette: { top: "#065282", mid: "#228CCB", bottom: "#BFE6FB" },
    subject: (u) => (
      <g>
        <defs>{linear(u, "tooth", "#FFFFFF", "#D3DEE8")}</defs>
        <path d="M168 72c-18 0-28 16-26 36 2 22 12 32 16 54 4 20 10 30 18 30 10 0 10-24 24-24s14 24 24 24c8 0 14-10 18-30 4-22 14-32 16-54 2-20-8-36-26-36-14 0-20 8-32 8s-18-8-32-8z" fill={url(u, "tooth")} />
        <path d="M160 92c0-8 8-12 16-10" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
        {sparkle(246, 84, 10)}
        {sparkle(160, 140, 6)}
      </g>
    ),
  },
  oncology: {
    palette: { top: "#7A1842", mid: "#C2477C", bottom: "#F7CDE0" },
    subject: (u) => (
      <g>
        <defs>{linear(u, "ribbon", "#FF9EC2", "#D81B60")}</defs>
        <path d="M172 182l42-78c8-16 2-34-14-34s-22 18-14 34l42 78" fill="none" stroke={url(u, "ribbon")} strokeWidth="18" />
        <path d="M186 104l42 78" fill="none" stroke="#B0164F" strokeOpacity="0.35" strokeWidth="20" />
        <path d="M186 104l42 78" fill="none" stroke={url(u, "ribbon")} strokeWidth="18" />
        <path d="M192 84c2-6 6-8 10-8" fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />
        {sparkle(240, 80, 8)}
      </g>
    ),
  },
  pulmonology: {
    palette: { top: "#0D534F", mid: "#1F9A8D", bottom: "#BDEFE6" },
    subject: (u) => {
      const lung = "M190 84c-22-4-42 16-46 46-4 28 6 46 24 46 14 0 22-12 22-26z";
      return (
        <g>
          <defs>{radial(u, "lung", "#FFCAD5", "#E17690")}</defs>
          <path d={lung} fill={url(u, "lung")} />
          <path d={lung} fill={url(u, "lung")} transform="translate(400 0) scale(-1 1)" />
          <path d="M200 56v42M200 98c-4 10-14 14-22 20M200 98c4 10 14 14 22 20" fill="none" stroke="#F6C1CB" strokeWidth="9" strokeLinecap="round" />
          <path d="M176 126l-12 8M178 142l-14 4M224 126l12 8M222 142l14 4" stroke="#C85F7A" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M160 102c4-6 10-8 16-8" fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    },
  },
  endocrinology: {
    palette: { top: "#3A620C", mid: "#68A127", bottom: "#DDF2BE" },
    subject: (u) => (
      <g>
        <defs>{radial(u, "drop", "#FF9A90", "#C62828")}</defs>
        <path d="M200 60s-36 44-36 70a36 36 0 0 0 72 0c0-26-36-70-36-70z" fill={url(u, "drop")} />
        <path d="M180 120c0-10 6-20 12-28" fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" />
        <g stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="2.5">
          <path d="M246 84l16-10M262 74l14 8M246 84l2 16" />
        </g>
        <circle cx="246" cy="84" r="6" fill="#FFFFFF" />
        <circle cx="262" cy="74" r="5" fill="#FFFFFF" opacity="0.9" />
        <circle cx="276" cy="82" r="4" fill="#FFFFFF" opacity="0.8" />
        <circle cx="248" cy="100" r="4" fill="#FFFFFF" opacity="0.8" />
        {sparkle(150, 100, 7)}
      </g>
    ),
  },
};
