import { auth, signOut } from "@/auth";
import { requireRole } from "@/lib/authz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="flex h-14 items-center px-6 gap-4">
          <Link href="/admin" className="font-semibold text-lg">
            Parallex Admin
          </Link>
          <Badge variant="outline">Admin</Badge>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button size="sm" variant="ghost" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="flex">
        <nav className="w-56 border-r bg-background min-h-[calc(100vh-3.5rem)] p-4">
          <div className="flex flex-col gap-1">
            <Link
              href="/admin/users"
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Users
            </Link>
            <Link
              href="/admin/audit"
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Audit Log
            </Link>
          </div>
        </nav>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
