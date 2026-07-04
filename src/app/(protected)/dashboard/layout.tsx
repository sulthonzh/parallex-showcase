import { auth, signOut } from "@/auth";
import { requireRole } from "@/lib/authz";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("developer", "admin");
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="flex h-14 items-center px-6 gap-4">
          <Link href="/dashboard" className="font-semibold text-lg">
            Parallex
          </Link>
          <Badge variant="outline" className="capitalize">
            {session.user.role}
          </Badge>
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
              href="/dashboard/projects"
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Projects
            </Link>
            <Link
              href="/dashboard/analytics"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Analytics
            </Link>
          </div>
          <Separator className="my-4" />
          {session.user.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Admin Console
            </Link>
          )}
        </nav>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
