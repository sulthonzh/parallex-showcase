import { describe, it, expect } from "vitest";
import { assertCan, AuthorizationError } from "@/lib/authz-pure";
import type { Role, Action } from "@/lib/authz-pure";

describe("assertCan", () => {
  const cases: Array<{
    actor: Role;
    action: Action;
    resource: { ownerId?: string; actorId: string };
    expected: boolean;
  }> = [
    {
      actor: "admin",
      action: "project:create",
      resource: { actorId: "u1" },
      expected: true,
    },
    {
      actor: "admin",
      action: "user:delete",
      resource: { actorId: "u1" },
      expected: true,
    },
    {
      actor: "developer",
      action: "project:create",
      resource: { actorId: "u1" },
      expected: true,
    },
    {
      actor: "developer",
      action: "user:delete",
      resource: { actorId: "u1" },
      expected: false,
    },
    {
      actor: "broker",
      action: "project:create",
      resource: { actorId: "u1" },
      expected: false,
    },
    {
      actor: "broker",
      action: "share-link:create",
      resource: { actorId: "u1" },
      expected: true,
    },
    {
      actor: "developer",
      action: "project:update",
      resource: { ownerId: "u1", actorId: "u1" },
      expected: true,
    },
    {
      actor: "developer",
      action: "project:update",
      resource: { ownerId: "u2", actorId: "u1" },
      expected: false,
    },
  ];

  for (const { actor, action, resource, expected } of cases) {
    it(`${actor} can ${action} on ${JSON.stringify(resource)} → ${expected}`, () => {
      expect(
        assertCan({ id: resource.actorId, role: actor }, action, resource),
      ).toBe(expected);
    });
  }

  it("throws AuthorizationError when assertCan fails AND throwOnFail is true", () => {
    expect(() =>
      assertCan(
        { id: "u1", role: "broker" },
        "user:delete",
        { actorId: "u1" },
        { throwOnFail: true },
      ),
    ).toThrowError(AuthorizationError);
  });
});
