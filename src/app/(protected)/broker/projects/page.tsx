import Link from "next/link";
import { getPublishedProjects } from "@/modules/broker/server";
import { GenerateShareLinkButton } from "@/components/broker/generate-share-link-button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BrokerProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Browse Projects</h1>
        <p className="text-sm text-muted-foreground">
          Generate shareable links for your clients
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No published projects yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:border-primary transition-colors"
            >
              <CardContent className="p-5">
                <h3 className="font-semibold mb-1">{project.name}</h3>
                {project.location && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {project.location}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mb-4">
                  {formatDate(project.createdAt)}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/projects/${project.slug}`}
                    target="_blank"
                    className="text-sm text-primary hover:underline"
                  >
                    View Hub
                  </Link>
                </div>
                <div className="mt-4">
                  <GenerateShareLinkButton
                    projectId={project.id}
                    projectName={project.name}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
