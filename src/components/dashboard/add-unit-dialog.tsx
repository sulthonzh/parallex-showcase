"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUnit } from "@/modules/project/server";
import { Plus } from "lucide-react";

export function AddUnitDialog({
  projectId,
  projectSlug,
}: {
  projectId: string;
  projectSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createUnit({
      projectId,
      code: formData.get("code") as string,
      name: (formData.get("name") as string) || undefined,
      beds: Number(formData.get("beds")) || undefined,
      baths: Number(formData.get("baths")) || undefined,
      areaSqft: Number(formData.get("areaSqft")) || undefined,
      price: Number(formData.get("price")) || undefined,
      floorNumber: Number(formData.get("floorNumber")) || undefined,
    });
    setLoading(false);
    if (result.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ size: "sm" })}>
        <Plus className="size-4 mr-1" />
        Add Unit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Unit</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <div className="space-y-2">
            <Label htmlFor="code">Unit Code</Label>
            <Input id="code" name="code" placeholder="e.g. A-101" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Unit Name (optional)</Label>
            <Input id="name" name="name" placeholder="e.g. 1-Bedroom Deluxe" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="beds">Beds</Label>
              <Input
                id="beds"
                name="beds"
                type="number"
                min="0"
                placeholder="2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baths">Baths</Label>
              <Input
                id="baths"
                name="baths"
                type="number"
                min="0"
                placeholder="2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floorNumber">Floor</Label>
              <Input
                id="floorNumber"
                name="floorNumber"
                type="number"
                min="0"
                placeholder="1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="areaSqft">Area (sqft)</Label>
              <Input
                id="areaSqft"
                name="areaSqft"
                type="number"
                min="0"
                placeholder="850"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                placeholder="350000"
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Unit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
