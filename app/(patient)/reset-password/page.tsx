import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetScreen } from "@/components/patient/AuthScreens";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };

export default function Page() {
  return <Suspense><ResetScreen /></Suspense>;
}
