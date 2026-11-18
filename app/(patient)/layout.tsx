import type { ReactNode } from "react";
import PatientShell from "@/components/patient/PatientShell";

// Patient pages: /, /clinics/[id], /location, /book/…, /tokens, /records, /profile.
export default function PatientLayout({ children }: { children: ReactNode }) {
  return <PatientShell>{children}</PatientShell>;
}
