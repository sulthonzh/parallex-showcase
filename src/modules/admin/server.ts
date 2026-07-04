"use server";

import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, auditLogs } from "@/lib/schema";
import { getCurrentUser } from "@/lib/authz";
import { ok, err, type Result } from "@/lib/result";
import { auditLog } from "@/lib/audit";
import type { Role } from "@/types/next-auth";

export async function getAllUsers() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .orderBy(desc(users.emailVerified));
}

export async function updateUserRole(
  userId: string,
  role: Role,
): Promise<Result<void, string>> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return err("Forbidden");
  if (userId === admin.id) return err("Cannot change your own role");

  const [existing] = await db.select().from(users).where(eq(users.id, userId));
  if (!existing) return err("User not found");

  await db.update(users).set({ role }).where(eq(users.id, userId));

  await auditLog({
    actor: admin,
    action: "user:role-update",
    entityType: "user",
    entityId: userId,
    before: { role: existing.role },
    after: { role },
  });

  revalidatePath("/admin/users");
  return ok(undefined);
}

export async function getAuditLogs(limit = 50) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return [];
  return db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
