import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Developer Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Phase 1 will populate projects + assets + analytics here.
        </CardContent>
      </Card>
    </div>
  );
}
