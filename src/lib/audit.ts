import "server-only";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/schema";
import type { Role } from "@/types/next-auth";

type Actor = { id: string; role: Role };

type AuditInput = {
  actor: Actor;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
};

export async function auditLog(input: AuditInput): Promise<void> {
  await db.insert(auditLogs).values({
    actorId: input.actor.id,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    before: input.before ?? null,
    after: input.after ?? null,
  });
}
