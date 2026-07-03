import { requireRole } from "@/lib/authz";

export default async function BrokerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("broker", "admin");
  return <>{children}</>;
}
