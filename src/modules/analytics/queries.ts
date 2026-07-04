import { db } from "@/lib/db";
import { engagementEvents, projects } from "@/lib/schema";
import { eq, desc, sql, count, countDistinct } from "drizzle-orm";

export async function getAnalyticsSummary() {
  const [totalEvents] = await db
    .select({ total: count() })
    .from(engagementEvents);

  const [uniqueSessions] = await db
    .select({ total: countDistinct(engagementEvents.sessionId) })
    .from(engagementEvents);

  const eventBreakdown = await db
    .select({
      type: engagementEvents.eventType,
      count: count(),
    })
    .from(engagementEvents)
    .groupBy(engagementEvents.eventType);

  const projectViews = await db
    .select({
      projectName: projects.name,
      projectSlug: projects.slug,
      views: count(),
      uniqueVisitors: countDistinct(engagementEvents.sessionId),
    })
    .from(engagementEvents)
    .innerJoin(projects, eq(engagementEvents.projectId, projects.id))
    .where(eq(engagementEvents.eventType, "view"))
    .groupBy(projects.id)
    .orderBy(desc(count()));

  const recentEvents = await db
    .select({
      eventType: engagementEvents.eventType,
      sessionId: engagementEvents.sessionId,
      createdAt: engagementEvents.createdAt,
      projectId: engagementEvents.projectId,
    })
    .from(engagementEvents)
    .orderBy(desc(engagementEvents.createdAt))
    .limit(20);

  return {
    totalEvents: totalEvents?.total ?? 0,
    uniqueSessions: uniqueSessions?.total ?? 0,
    eventBreakdown: eventBreakdown.map((e) => ({
      type: e.type,
      count: e.count,
    })),
    projectViews,
    recentEvents,
  };
}

const INTENT_WEIGHTS: Record<string, number> = {
  view: 1,
  click: 3,
  inquire: 5,
  save: 10,
  heartbeat: 0.1,
};

export function calculateIntentScore(events: { eventType: string }[]): number {
  const score = events.reduce(
    (sum, e) => sum + (INTENT_WEIGHTS[e.eventType] ?? 0),
    0,
  );
  return Math.min(100, Math.round(score));
}
