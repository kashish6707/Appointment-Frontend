import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotScreen } from "@/components/patient/AuthScreens";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function Page() {
  return <Suspense><ForgotScreen /></Suspense>;
}
