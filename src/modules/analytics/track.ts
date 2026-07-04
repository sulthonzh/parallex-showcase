import { db } from "@/lib/db";
import { engagementEvents } from "@/lib/schema";
import { headers } from "next/headers";

export async function trackEvent(
  projectId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
) {
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? "unknown";
  const userAgent = h.get("user-agent") ?? "unknown";
  const sessionId = `${ip}-${userAgent}`.slice(0, 100);

  await db
    .insert(engagementEvents)
    .values({
      projectId,
      eventType,
      sessionId,
      metadata: { ...metadata, ip: ip.slice(0, 50) },
    })
    .catch(() => {});
}
