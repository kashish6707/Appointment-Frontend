import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInScreen } from "@/components/patient/AuthScreens";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function Page() {
  return <Suspense><SignInScreen /></Suspense>;
}
