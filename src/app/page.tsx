import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/types/next-auth";

const HOME_BY_ROLE: Record<Role, string> = {
  admin: "/admin",
  developer: "/dashboard",
  broker: "/broker",
};

export default async function Home() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role) redirect("/login");
  redirect(HOME_BY_ROLE[role] ?? "/login");
}
