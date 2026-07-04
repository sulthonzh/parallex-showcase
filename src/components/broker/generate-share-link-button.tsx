"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createShareLink } from "@/modules/broker/server";
import { Copy, Link2 } from "lucide-react";

export function GenerateShareLinkButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    const result = await createShareLink(projectId);
    setLoading(false);
    if (result.ok) {
      setLink(`${window.location.origin}/s/${result.value.token}`);
    }
  }

  function handleCopy() {
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (link) {
    return (
      <div className="flex items-center gap-2">
        <Input readOnly value={link} className="text-xs" />
        <Button size="sm" variant="outline" onClick={handleCopy}>
          <Copy className="size-3.5" />
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      <Link2 className="size-3.5 mr-1" />
      {loading ? "Generating..." : "Generate Link"}
    </button>
  );
}
