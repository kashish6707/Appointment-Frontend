import type { Metadata } from "next";
import TokensScreen from "@/components/patient/TokensScreen";

export const metadata: Metadata = { title: "My tokens" };

export default function Page() {
  return <TokensScreen />;
}
