"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, assets, units } from "@/lib/schema";
import { getCurrentUser, assertCan } from "@/lib/authz";
import { ok, err, type Result } from "@/lib/result";
import { auditLog } from "@/lib/audit";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// --- Schemas ---

export const createProjectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  heroImageUrl: z.string().url().optional().or(z.literal("")),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(["draft", "published"]).optional(),
});

export const createAssetSchema = z.object({
  projectId: z.string().uuid(),
  type: z
    .enum(["render", "film", "floorplan", "brochure", "gallery"])
    .default("gallery"),
  title: z.string().min(2).max(200),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().max(1000).optional(),
});

export const createUnitSchema = z.object({
  projectId: z.string().uuid(),
  code: z.string().min(1).max(50),
  name: z.string().max(200).optional(),
  beds: z.coerce.number().int().min(0).optional(),
  baths: z.coerce.number().int().min(0).optional(),
  areaSqft: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().int().min(0).optional(),
  floorNumber: z.coerce.number().int().min(0).optional(),
});

// --- Queries (for server components) ---

export async function getProjectsForUser() {
  const user = await getCurrentUser();
  if (!user) return [];
  if (user.role === "admin") {
    return db.select().from(projects).orderBy(projects.createdAt);
  }
  return db
    .select()
    .from(projects)
    .where(eq(projects.developerId, user.id))
    .orderBy(projects.createdAt);
}

export async function getProjectBySlug(slug: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug));
  if (!project) return null;
  const projectAssets = await db
    .select()
    .from(assets)
    .where(eq(assets.projectId, project.id))
    .orderBy(assets.sortOrder, assets.createdAt);
  const projectUnits = await db
    .select()
    .from(units)
    .where(eq(units.projectId, project.id))
    .orderBy(units.code);
  return { ...project, assets: projectAssets, units: projectUnits };
}

// --- Project Mutations ---

export async function createProject(
  input: z.infer<typeof createProjectSchema>,
): Promise<Result<{ id: string; slug: string }, string>> {
  const user = await getCurrentUser();
  if (!user) return err("Not authenticated");
  assertCan(
    user,
    "project:create",
    { actorId: user.id },
    { throwOnFail: true },
  );

  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success)
    return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const slug = slugify(parsed.data.name);
  const [project] = await db
    .insert(projects)
    .values({
      developerId: user.id,
      slug,
      name: parsed.data.name,
      description: parsed.data.description,
      location: parsed.data.location,
      heroImageUrl: parsed.data.heroImageUrl || null,
    })
    .returning();

  await auditLog({
    actor: user,
    action: "project:create",
    entityType: "project",
    entityId: project!.id,
    after: project,
  });

  revalidatePath("/dashboard/projects");
  return ok({ id: project!.id, slug: project!.slug });
}

export async function updateProject(
  projectId: string,
  input: z.infer<typeof updateProjectSchema>,
): Promise<Result<void, string>> {
  const user = await getCurrentUser();
  if (!user) return err("Not authenticated");

  const [existing] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!existing) return err("Project not found");

  assertCan(
    user,
    "project:update",
    { actorId: user.id, ownerId: existing.developerId },
    { throwOnFail: true },
  );

  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success)
    return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const updates: Record<string, unknown> = {
    ...parsed.data,
    updatedAt: new Date(),
  };
  if (parsed.data.heroImageUrl === "") updates.heroImageUrl = null;

  const [updated] = await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, projectId))
    .returning();

  await auditLog({
    actor: user,
    action: "project:update",
    entityType: "project",
    entityId: projectId,
    before: existing,
    after: updated,
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${existing.slug}`);
  return ok(undefined);
}

export async function deleteProject(
  projectId: string,
): Promise<Result<void, string>> {
  const user = await getCurrentUser();
  if (!user) return err("Not authenticated");

  const [existing] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!existing) return err("Project not found");

  assertCan(
    user,
    "project:delete",
    { actorId: user.id, ownerId: existing.developerId },
    { throwOnFail: true },
  );

  await db.delete(projects).where(eq(projects.id, projectId));

  await auditLog({
    actor: user,
    action: "project:delete",
    entityType: "project",
    entityId: projectId,
    before: existing,
  });

  revalidatePath("/dashboard/projects");
  return ok(undefined);
}

// --- Asset Mutations ---

export async function createAsset(
  input: z.infer<typeof createAssetSchema>,
): Promise<Result<{ id: string }, string>> {
  const user = await getCurrentUser();
  if (!user) return err("Not authenticated");

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, input.projectId));
  if (!project) return err("Project not found");

  assertCan(
    user,
    "asset:upload",
    { actorId: user.id, ownerId: project.developerId },
    { throwOnFail: true },
  );

  const parsed = createAssetSchema.safeParse(input);
  if (!parsed.success)
    return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const [asset] = await db
    .insert(assets)
    .values({
      projectId: parsed.data.projectId,
      type: parsed.data.type,
      title: parsed.data.title,
      url: parsed.data.url,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
      description: parsed.data.description,
    })
    .returning();

  await auditLog({
    actor: user,
    action: "asset:upload",
    entityType: "asset",
    entityId: asset!.id,
    after: asset,
  });

  revalidatePath(`/dashboard/projects/${project.slug}`);
  return ok({ id: asset!.id });
}

export async function deleteAsset(
  assetId: string,
): Promise<Result<void, string>> {
  const user = await getCurrentUser();
  if (!user) return err("Not authenticated");

  const [asset] = await db.select().from(assets).where(eq(assets.id, assetId));
  if (!asset) return err("Asset not found");

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, asset.projectId));
  if (!project) return err("Project not found");

  assertCan(
    user,
    "asset:upload",
    { actorId: user.id, ownerId: project.developerId },
    { throwOnFail: true },
  );

  await db.delete(assets).where(eq(assets.id, assetId));

  await auditLog({
    actor: user,
    action: "asset:delete",
    entityType: "asset",
    entityId: assetId,
    before: asset,
  });

  revalidatePath(`/dashboard/projects/${project.slug}`);
  return ok(undefined);
}

// --- Unit Mutations ---

export async function createUnit(
  input: z.infer<typeof createUnitSchema>,
): Promise<Result<{ id: string }, string>> {
  const user = await getCurrentUser();
  if (!user) return err("Not authenticated");

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, input.projectId));
  if (!project) return err("Project not found");

  assertCan(
    user,
    "project:update",
    { actorId: user.id, ownerId: project.developerId },
    { throwOnFail: true },
  );

  const parsed = createUnitSchema.safeParse(input);
  if (!parsed.success)
    return err(parsed.error.issues[0]?.message ?? "Invalid input");

  const [unit] = await db
    .insert(units)
    .values({
      projectId: parsed.data.projectId,
      code: parsed.data.code,
      name: parsed.data.name,
      beds: parsed.data.beds,
      baths: parsed.data.baths,
      areaSqft: parsed.data.areaSqft,
      price: parsed.data.price,
      floorNumber: parsed.data.floorNumber,
    })
    .returning();

  await auditLog({
    actor: user,
    action: "unit:create",
    entityType: "unit",
    entityId: unit!.id,
    after: unit,
  });

  revalidatePath(`/dashboard/projects/${project.slug}`);
  return ok({ id: unit!.id });
}

export async function deleteUnit(
  unitId: string,
): Promise<Result<void, string>> {
  const user = await getCurrentUser();
  if (!user) return err("Not authenticated");

  const [unit] = await db.select().from(units).where(eq(units.id, unitId));
  if (!unit) return err("Unit not found");

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, unit.projectId));
  if (!project) return err("Project not found");

  assertCan(
    user,
    "project:update",
    { actorId: user.id, ownerId: project.developerId },
    { throwOnFail: true },
  );

  await db.delete(units).where(eq(units.id, unitId));

  await auditLog({
    actor: user,
    action: "unit:delete",
    entityType: "unit",
    entityId: unitId,
    before: unit,
  });

  revalidatePath(`/dashboard/projects/${project.slug}`);
  return ok(undefined);
}

export async function updateUnitStatus(
  unitId: string,
  status: "available" | "reserved" | "sold",
): Promise<Result<void, string>> {
  const user = await getCurrentUser();
  if (!user) return err("Not authenticated");

  const [unit] = await db.select().from(units).where(eq(units.id, unitId));
  if (!unit) return err("Unit not found");

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, unit.projectId));
  if (!project) return err("Project not found");

  assertCan(
    user,
    "project:update",
    { actorId: user.id, ownerId: project.developerId },
    { throwOnFail: true },
  );

  await db
    .update(units)
    .set({ status, updatedAt: new Date() })
    .where(eq(units.id, unitId));

  await auditLog({
    actor: user,
    action: "unit:update",
    entityType: "unit",
    entityId: unitId,
    before: unit,
    after: { status },
  });

  revalidatePath(`/dashboard/projects/${project.slug}`);
  return ok(undefined);
}
