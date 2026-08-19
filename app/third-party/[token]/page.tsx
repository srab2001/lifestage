import { PhysicianPortal } from "@/components/physician-portal";

export default async function ThirdPartyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PhysicianPortal token={token} />;
}
