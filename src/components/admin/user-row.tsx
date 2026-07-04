"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRole } from "@/modules/admin/server";
import type { Role } from "@/types/next-auth";

export function UserRow({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: Role;
}) {
  const router = useRouter();

  async function handleChange(value: string | null) {
    if (!value || value === currentRole) return;
    await updateUserRole(userId, value as Role);
    router.refresh();
  }

  return (
    <Select defaultValue={currentRole} onValueChange={handleChange}>
      <SelectTrigger className="w-36 h-8 text-xs capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="developer">Developer</SelectItem>
        <SelectItem value="broker">Broker</SelectItem>
      </SelectContent>
    </Select>
  );
}
