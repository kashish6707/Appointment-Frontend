// Simple line icons (24×24, stroke = currentColor). Decorative: callers label the control.

import type { ReactNode, SVGProps } from "react";

function Svg({ children, size = 24, ...rest }: SVGProps<SVGSVGElement> & { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

type P = { size?: number; className?: string };

export const PinIcon = (p: P) => <Svg {...p}><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></Svg>;
export const SearchIcon = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></Svg>;
export const ChevronDown = (p: P) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const ChevronLeft = (p: P) => <Svg {...p}><path d="m15 6-6 6 6 6" /></Svg>;
export const ChevronRight = (p: P) => <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>;
export const WarningIcon = (p: P) => <Svg {...p}><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4M12 17.2v.1" /></Svg>;
export const PhoneIcon = (p: P) => <Svg {...p}><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></Svg>;
export const DirectionsIcon = (p: P) => <Svg {...p}><path d="M12 2.5 21.5 12 12 21.5 2.5 12 12 2.5Z" /><path d="M9 14v-2.5a1.5 1.5 0 0 1 1.5-1.5H15" /><path d="m13 8 2 2-2 2" /></Svg>;
export const CloseIcon = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const HomeIcon = (p: P) => <Svg {...p}><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /></Svg>;
export const TicketIcon = (p: P) => <Svg {...p}><path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7Z" /><path d="M14 7v10" strokeDasharray="2 2" /></Svg>;
export const FolderIcon = (p: P) => <Svg {...p}><path d="M3 7h6l2 2h10v10H3V7Z" /></Svg>;
export const HelpIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.1" /></Svg>;
export const TargetIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></Svg>;
export const ClockIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;

/** One icon per department (by the backend's iconKey). */
export function DepartmentIcon({ iconKey, size = 30 }: { iconKey: string; size?: number }) {
  const s = { size };
  switch (iconKey) {
    case "stethoscope":
      return <Svg {...s}><path d="M6 3v6a4 4 0 0 0 8 0V3" /><path d="M10 13v3a4 4 0 0 0 8 0v-2" /><circle cx="18" cy="12" r="2" /></Svg>;
    case "stomach":
      return <Svg {...s}><path d="M9 3v4c0 2-3 2.5-3 6a6 6 0 0 0 6 6c4 0 6-2 6-5s-3-3.5-3-6V3" /><path d="M12 19v2" /></Svg>;
    case "female":
      return <Svg {...s}><circle cx="12" cy="8.5" r="5" /><path d="M12 13.5V21M9 18h6" /></Svg>;
    case "bone":
      return <Svg {...s}><path d="M7.5 16.5 16.5 7.5" /><path d="M16.5 7.5a2.5 2.5 0 1 1 3-3 2.5 2.5 0 1 1-3 3ZM7.5 16.5a2.5 2.5 0 1 1-3 3 2.5 2.5 0 1 1 3-3Z" /></Svg>;
    case "baby":
      return <Svg {...s}><circle cx="12" cy="12" r="8" /><path d="M9 14c1.5 1.5 4.5 1.5 6 0M9.5 10v.1M14.5 10v.1M12 4a2 2 0 0 0 2 2" /></Svg>;
    case "skin":
      return <Svg {...s}><path d="M7 21V9a5 5 0 0 1 10 0v12" /><path d="M10 11v.1M14 14v.1M11 17v.1" /></Svg>;
    case "eye":
      return <Svg {...s}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></Svg>;
    case "heart":
      return <Svg {...s}><path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10Z" /><path d="M7 12h3l1.5-2 2 4 1.5-2h2" /></Svg>;
    case "ear":
      return <Svg {...s}><path d="M8 18a3 3 0 0 0 5-1c.5-2 4-3 4-7a5 5 0 0 0-10 0" /><path d="M10 10a2 2 0 0 1 4 0c0 1.5-2 2-2 3.5" /></Svg>;
    case "tooth":
      return <Svg {...s}><path d="M7 4c-2 0-3 1.5-3 4 0 3 1.5 4 2 7s1 6 2.5 6 1.5-4 3.5-4 2 4 3.5 4 2-3 2.5-6 2-4 2-7c0-2.5-1-4-3-4s-3 1-5 1-3-1-5-1Z" /></Svg>;
    case "brain":
      return <Svg {...s}><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1ZM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1" /></Svg>;
    case "mind":
      return <Svg {...s}><path d="M12 3a7 7 0 0 0-7 7c0 2.5 1.5 4 2 5v5h7v-3h2a2 2 0 0 0 2-2v-2l2-1-2-3a7 7 0 0 0-6-6Z" /></Svg>;
    case "scalpel":
      return <Svg {...s}><path d="M3 21 14 10l3 3L7 21H3Z" /><path d="m14 10 5-5 2 2-5 5" /></Svg>;
    case "kidney":
      return <Svg {...s}><path d="M9 4C5 4 4 8 4 12s1 8 5 8 4-3 3-5-1-4 0-6 0-5-3-5ZM15 4c4 0 5 4 5 8s-1 8-5 8" /></Svg>;
    case "ribbon":
      return <Svg {...s}><path d="M12 13c-3-3-4-5-4-7a4 4 0 0 1 8 0c0 2-1 4-4 7Zm0 0-4 8M12 13l4 8" /></Svg>;
    case "lungs":
      return <Svg {...s}><path d="M12 4v8M12 12c-1 1-3 1-4 0M12 12c1 1 3 1 4 0" /><path d="M8 7c-3 1-4 6-4 9 0 2 1 3 3 3s2-1 2-3V9M16 7c3 1 4 6 4 9 0 2-1 3-3 3s-2-1-2-3V9" /></Svg>;
    case "drop":
      return <Svg {...s}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" /></Svg>;
    default:
      return <Svg {...s}><path d="M12 5v14M5 12h14" /></Svg>;
  }
}
