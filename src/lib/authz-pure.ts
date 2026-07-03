import type { Role } from "@/types/next-auth";

export type { Role };

export type Action =
  | "project:create"
  | "project:update"
  | "project:delete"
  | "asset:upload"
  | "asset:publish"
  | "share-link:create"
  | "user:invite"
  | "user:delete"
  | "audit:read";

type Actor = { id: string; role: Role };
type Resource = { ownerId?: string; actorId: string };
type AssertOptions = { throwOnFail?: boolean };

const ROLE_MATRIX: Record<Role, Action[]> = {
  admin: [
    "project:create",
    "project:update",
    "project:delete",
    "asset:upload",
    "asset:publish",
    "share-link:create",
    "user:invite",
    "user:delete",
    "audit:read",
  ],
  developer: [
    "project:create",
    "project:update",
    "asset:upload",
    "asset:publish",
    "share-link:create",
  ],
  broker: ["share-link:create"],
};

const OWNER_SCOPED_ACTIONS = new Set<Action>([
  "project:update",
  "project:delete",
]);

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function assertCan(
  actor: Actor,
  action: Action,
  resource: Resource,
  opts: AssertOptions = {},
): boolean {
  const allowed = ROLE_MATRIX[actor.role]?.includes(action) ?? false;
  if (!allowed) {
    if (opts.throwOnFail)
      throw new AuthorizationError(`Forbidden: ${actor.role} cannot ${action}`);
    return false;
  }
  if (
    OWNER_SCOPED_ACTIONS.has(action) &&
    resource.ownerId &&
    resource.ownerId !== actor.id
  ) {
    if (opts.throwOnFail)
      throw new AuthorizationError("Forbidden: not owner of resource");
    return false;
  }
  return true;
}
