"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { approveAsset, rejectAsset } from "@/modules/project/server";

export function ApprovalActions({ assetId }: { assetId: string }) {
  const router = useRouter();

  async function handleApprove() {
    await approveAsset(assetId);
    router.refresh();
  }

  async function handleReject() {
    await rejectAsset(assetId);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="default" onClick={handleApprove}>
        <Check className="size-3.5 mr-1" />
        Approve
      </Button>
      <Button size="sm" variant="outline" onClick={handleReject}>
        <X className="size-3.5 mr-1" />
        Reject
      </Button>
    </div>
  );
}
