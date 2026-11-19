import type { Metadata } from "next";
import { Suspense } from "react";
import { MemberScreen } from "@/components/patient/ProfileScreens";

export const metadata: Metadata = { title: "Profile details", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  return <Suspense><MemberScreen memberId={memberId} /></Suspense>;
}
