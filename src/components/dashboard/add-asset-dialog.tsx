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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAsset } from "@/modules/project/server";
import { Plus } from "lucide-react";

export function AddAssetDialog({
  projectId,
  projectSlug,
}: {
  projectId: string;
  projectSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState("gallery");
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createAsset({
      projectId,
      type: type as "render" | "film" | "floorplan" | "brochure" | "gallery",
      title: formData.get("title") as string,
      url: formData.get("url") as string,
      thumbnailUrl: (formData.get("thumbnailUrl") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
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
        Add Asset
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => v && setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="render">Render</SelectItem>
                <SelectItem value="film">Film / Video</SelectItem>
                <SelectItem value="floorplan">Floor Plan</SelectItem>
                <SelectItem value="brochure">Brochure</SelectItem>
                <SelectItem value="gallery">Gallery Image</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Living Room Render"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Asset URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
            <Input
              id="thumbnailUrl"
              name="thumbnailUrl"
              type="url"
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Brief description"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Asset"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
