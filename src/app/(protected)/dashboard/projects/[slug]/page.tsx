import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/modules/project/server";
import { ProjectDetail } from "@/components/dashboard/project-detail";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  return <ProjectDetail project={project} />;
}
