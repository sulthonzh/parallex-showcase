import { getPendingAssets } from "@/modules/project/server";
import { ApprovalActions } from "@/components/admin/approval-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const pending = await getPendingAssets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Approval Queue</h1>
        <p className="text-sm text-muted-foreground">
          Assets awaiting review before publication
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No pending approvals
                  </TableCell>
                </TableRow>
              ) : (
                pending.map((row) => (
                  <TableRow key={row.asset.id}>
                    <TableCell>
                      <p className="font-medium">{row.asset.title}</p>
                      <Link
                        href={`/dashboard/projects/${row.projectSlug}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View in project
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{row.projectName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {row.asset.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ApprovalActions assetId={row.asset.id} />
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
