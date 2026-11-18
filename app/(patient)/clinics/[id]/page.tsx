import ClinicScreen from "@/components/patient/ClinicScreen";

export default async function ClinicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClinicScreen id={id} />;
}
