"use client";

import { useEffect } from "react";
import { trackEvent } from "@/modules/analytics/track";

export function HubTracker({
  projectId,
  shareLinkToken,
}: {
  projectId: string;
  shareLinkToken?: string;
}) {
  useEffect(() => {
    const meta = shareLinkToken ? { shareLinkToken } : undefined;
    const interval = setInterval(() => {
      void trackEvent(projectId, "heartbeat", meta);
    }, 15000);
    return () => clearInterval(interval);
  }, [projectId, shareLinkToken]);

  return null;
}

export function trackClick(projectId: string, assetTitle?: string) {
  void trackEvent(
    projectId,
    "click",
    assetTitle ? { asset: assetTitle } : undefined,
  );
}

export function trackInquire(projectId: string) {
  void trackEvent(projectId, "inquire");
}
