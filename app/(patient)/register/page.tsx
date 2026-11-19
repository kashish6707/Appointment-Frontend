import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterScreen } from "@/components/patient/AuthScreens";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function Page() {
  return <Suspense><RegisterScreen /></Suspense>;
}
