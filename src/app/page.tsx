import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/types/next-auth";
import { LandingPage } from "@/components/landing/landing-page";
import { Toaster } from "@/components/ui/sonner";

const HOME_BY_ROLE: Record<Role, string> = {
  admin: "/admin",
  developer: "/dashboard",
  broker: "/broker",
};

export default async function Home() {
  const session = await auth();
  const role = session?.user?.role;
  if (role) redirect(HOME_BY_ROLE[role] ?? "/login");
  return <LandingPage />;
}
