import type { Metadata } from "next";
import RecordsScreen from "@/components/patient/RecordsScreen";

export const metadata: Metadata = { title: "My records", robots: { index: false } };

export default function Page() {
  return <RecordsScreen />;
}
