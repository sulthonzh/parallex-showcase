import { requireRole } from "@/lib/authz";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("developer", "admin");
  return <>{children}</>;
}
