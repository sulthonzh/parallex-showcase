"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, shareLinks } from "@/lib/schema";
import { getCurrentUser, assertCan } from "@/lib/authz";
import { ok, err, type Result } from "@/lib/result";
import { auditLog } from "@/lib/audit";

export async function getPublishedProjects() {
  return db
    .select()
    .from(projects)
    .where(eq(projects.status, "published"))
    .orderBy(projects.createdAt);
}

export async function getBrokerShareLinks() {
  const user = await getCurrentUser();
  if (!user) return [];
  return db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.brokerId, user.id))
    .orderBy(shareLinks.createdAt);
}

export async function createShareLink(
  projectId: string,
): Promise<Result<{ token: string }, string>> {
  const user = await getCurrentUser();
  if (!user) return err("Not authenticated");
  assertCan(
    user,
    "share-link:create",
    { actorId: user.id },
    { throwOnFail: true },
  );

  const [link] = await db
    .insert(shareLinks)
    .values({
      projectId,
      brokerId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })
    .returning();

  await auditLog({
    actor: user,
    action: "share-link:create",
    entityType: "share_link",
    entityId: link!.id,
    after: { projectId, token: link!.token },
  });

  revalidatePath("/broker/share-links");
  return ok({ token: link!.token });
}

export async function validateShareLink(
  token: string,
): Promise<
  Result<{ projectId: string; projectName: string; slug: string }, string>
> {
  const [link] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.token, token));
  if (!link) return err("Invalid or expired share link");

  if (link.expiresAt && link.expiresAt < new Date()) {
    return err("This share link has expired");
  }

  if (link.maxUses && link.currentUses >= link.maxUses) {
    return err("This share link has reached its usage limit");
  }

  await db
    .update(shareLinks)
    .set({ currentUses: link.currentUses + 1 })
    .where(eq(shareLinks.id, link.id));

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, link.projectId));
  if (!project) return err("Project not found");

  return ok({
    projectId: project.id,
    projectName: project.name,
    slug: project.slug,
  });
}
