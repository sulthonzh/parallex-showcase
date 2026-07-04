import { getBrokerShareLinks } from "@/modules/broker/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ShareLinksPage() {
  const links = await getBrokerShareLinks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Share Links</h1>
        <p className="text-sm text-muted-foreground">Track and manage links you have shared</p>
      </div>
      {links.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No share links yet. Generate one from the Browse Projects page.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <Card key={link.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">/s/{link.token.slice(0, 12)}...</code>
                    <Badge variant="outline">{link.currentUses} uses</Badge>
                    {link.expiresAt && link.expiresAt > new Date() && <Badge variant="secondary">Active</Badge>}
                    {link.expiresAt && link.expiresAt < new Date() && <Badge variant="destructive">Expired</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">Created {formatDate(link.createdAt)}</p>
                </div>
                <Link href={`/s/${link.token}`} target="_blank" className="text-sm text-primary hover:underline">Open</Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
