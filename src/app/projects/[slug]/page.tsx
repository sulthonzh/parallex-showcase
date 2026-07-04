import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, assets, units } from "@/lib/schema";
import { trackEvent } from "@/modules/analytics/track";
import { formatPrice, formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PublicHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug));
  if (!project || project.status !== "published") notFound();

  const projectAssets = await db
    .select()
    .from(assets)
    .where(eq(assets.projectId, project.id))
    .orderBy(assets.sortOrder, assets.createdAt);

  const projectUnits = await db
    .select()
    .from(units)
    .where(eq(units.projectId, project.id))
    .orderBy(units.code);

  void trackEvent(project.id, "view");

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <span className="text-sm font-medium tracking-wider uppercase text-zinc-400">
            Parallex
          </span>
          <Link
            href="/login"
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            Broker Login
          </Link>
        </div>
      </header>

      {project.heroImageUrl ? (
        <section className="relative h-[60vh] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.heroImageUrl}
            alt={project.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="mx-auto max-w-6xl">
              <h1 className="text-5xl font-bold tracking-tight">
                {project.name}
              </h1>
              {project.location && (
                <p className="mt-2 text-lg text-zinc-300">{project.location}</p>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-5xl font-bold tracking-tight">
              {project.name}
            </h1>
            {project.location && (
              <p className="mt-2 text-lg text-zinc-400">{project.location}</p>
            )}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-6 py-12 space-y-16">
        {project.description && (
          <section>
            <p className="text-lg leading-relaxed text-zinc-300 max-w-3xl">
              {project.description}
            </p>
          </section>
        )}

        {projectAssets.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Gallery</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projectAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative rounded-xl overflow-hidden bg-zinc-900 aspect-[4/3]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.thumbnailUrl || asset.url}
                    alt={asset.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-sm font-medium">{asset.title}</p>
                    <span className="text-xs text-zinc-400 capitalize">
                      {asset.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {projectUnits.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Available Units</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projectUnits
                .filter((u) => u.status === "available")
                .map((unit) => (
                  <div
                    key={unit.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3 hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-lg">
                          {unit.name || unit.code}
                        </p>
                        <p className="text-sm text-zinc-500">
                          Code: {unit.code}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-emerald-600/50 text-emerald-400"
                      >
                        Available
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-zinc-500">Beds</p>
                        <p className="font-medium">{unit.beds ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Baths</p>
                        <p className="font-medium">{unit.baths ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Area</p>
                        <p className="font-medium">
                          {formatNumber(unit.areaSqft)} ft²
                        </p>
                      </div>
                    </div>
                    {unit.price && (
                      <div className="pt-2 border-t border-zinc-800">
                        <p className="text-2xl font-bold">
                          {formatPrice(unit.price)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-800 p-8 text-center">
          <h2 className="text-2xl font-semibold mb-2">
            Interested in {project.name}?
          </h2>
          <p className="text-zinc-400 mb-6">
            Contact a broker for more information and to schedule a viewing.
          </p>
          <a
            href="mailto:brokers@getparallex.com"
            className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-950 hover:bg-zinc-200 transition-colors"
          >
            Contact Broker
          </a>
        </section>
      </div>

      <footer className="border-t border-zinc-800 px-6 py-8">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <span className="text-sm text-zinc-600">Powered by Parallex</span>
          <span className="text-sm text-zinc-600">
            Built to Pitch. Designed to Close.
          </span>
        </div>
      </footer>
    </main>
  );
}
