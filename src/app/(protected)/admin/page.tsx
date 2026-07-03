import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Console</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          User management + audit log land here in Phase 3.
        </CardContent>
      </Card>
    </div>
  );
}
