import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BrokerPage() {
  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Broker Workspace</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Browse projects + generate share-links here in Phase 2.
        </CardContent>
      </Card>
    </div>
  );
}
