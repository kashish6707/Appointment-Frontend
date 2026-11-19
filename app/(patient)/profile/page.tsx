import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileScreen } from "@/components/patient/ProfileScreens";

export const metadata: Metadata = { title: "My profile", robots: { index: false } };

export default function Page() {
  return <Suspense><ProfileScreen /></Suspense>;
}
