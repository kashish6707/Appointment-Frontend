import type { Metadata } from "next";
import TrackScreen from "@/components/patient/TrackScreen";

export const metadata: Metadata = { title: "Your token", robots: { index: false } };

// The tracking link: /track/<bookingId>?code=<trackingCode>. The code is the key, so the page
// works on any phone it is opened on, without signing in.
export default async function TrackPage({ params, searchParams }: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { bookingId } = await params;
  const code = (await searchParams).code;
  return <TrackScreen bookingId={decodeURIComponent(bookingId)} code={typeof code === "string" ? code : ""} />;
}
