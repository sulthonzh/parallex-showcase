import { getAnalyticsSummary } from "@/modules/analytics/queries";
import {
  EventTypeChart,
  ProjectViewsChart,
} from "@/components/dashboard/analytics-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getAnalyticsSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Engagement across all your projects
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalEvents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Unique Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.uniqueSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Event Types</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.eventBreakdown.length}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <EventTypeChart data={data.eventBreakdown} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Views</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectViewsChart data={data.projectViews as never} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentEvents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground py-8"
                  >
                    No activity yet
                  </TableCell>
                </TableRow>
              ) : (
                data.recentEvents.map((event, i) => (
                  <TableRow key={event.createdAt.toISOString() + i}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {event.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {event.sessionId.slice(0, 12)}...
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
