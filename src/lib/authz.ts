import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/types/next-auth";

export type { Role };
export { assertCan, AuthorizationError, type Action } from "./authz-pure";

type Actor = { id: string; role: Role };

export async function getCurrentUser(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.role) return null;
  return { id: session.user.id, role: session.user.role };
}

export async function requireRole(...roles: Role[]) {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) redirect("/unauthorized");
  return user;
}
