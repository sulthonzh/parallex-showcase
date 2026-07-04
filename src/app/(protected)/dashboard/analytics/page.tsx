import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Engagement Analytics</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground py-16 text-center">
          Real-time engagement tracking lands here in Phase 4.
        </CardContent>
      </Card>
    </div>
  );
}
