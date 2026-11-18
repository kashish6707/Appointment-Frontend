import type { Metadata } from "next";
import BookScreen from "@/components/patient/BookScreen";

export const metadata: Metadata = { title: "Book a token" };

export default async function BookPage({ params }: { params: Promise<{ doctorClinicId: string }> }) {
  const { doctorClinicId } = await params;
  return <BookScreen doctorClinicId={decodeURIComponent(doctorClinicId)} />;
}
