import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { LayoutDashboard, Globe, BarChart3, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export async function LandingPage() {
  let featuredProjects: {
    id: string;
    name: string;
    slug: string;
    location: string | null;
    description: string | null;
    heroImageUrl: string | null;
  }[] = [];
  try {
    featuredProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
        location: projects.location,
        description: projects.description,
        heroImageUrl: projects.heroImageUrl,
      })
      .from(projects)
      .where(eq(projects.status, "published"))
      .orderBy(projects.createdAt)
      .limit(3);
  } catch {}

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/50 backdrop-blur-sm sticky top-0 z-50 bg-zinc-950/80">
        <div className="mx-auto max-w-6xl flex h-16 items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight">Parallex</span>
          <nav className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-zinc-100"
            >
              Sign in
            </Link>
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-zinc-950 to-zinc-950" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              The operating system
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                for real estate sales.
              </span>
            </h1>
            <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed">
              Centralize renders, films, brochures, and availability into
              interactive sales hubs. Track how buyers engage. Close faster.
              Built for developers and brokers.
            </p>
            <div className="mt-8 flex gap-4">
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                Explore the Demo <ArrowRight className="size-4 ml-1" />
              </Link>
              {featuredProjects.length > 0 && (
                <Link
                  href={`/projects/${featuredProjects[0]!.slug}`}
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  View Live Hub
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {featuredProjects.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold mb-8">Featured Projects</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((p) => (
              <Link key={p.id} href={`/projects/${p.slug}`}>
                <div className="group relative rounded-xl overflow-hidden bg-zinc-900 aspect-[4/3] hover:ring-2 ring-blue-500/50 transition-all">
                  {p.heroImageUrl && (
                    <img
                      src={p.heroImageUrl}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-semibold">{p.name}</h3>
                    {p.location && (
                      <p className="text-sm text-zinc-300">{p.location}</p>
                    )}
                    {p.description && (
                      <p className="text-sm text-zinc-400 mt-2 line-clamp-2">
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              Icon: LayoutDashboard,
              title: "Developer Dashboard",
              desc: "Manage projects, upload assets, track units — all in one place with role-based access control.",
            },
            {
              Icon: Globe,
              title: "Interactive Sales Hubs",
              desc: "Cinematic project pages with renders, floorplans, and real-time availability for buyers.",
            },
            {
              Icon: BarChart3,
              title: "Engagement Analytics",
              desc: "See which projects buyers view, how long they stay, and what they click with live charts.",
            },
          ].map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6"
            >
              <Icon className="size-8 text-blue-400 mb-4" />
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-zinc-800/50">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Built to Pitch. Designed to Close.
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            Dashboard, public hubs, broker tools, analytics, approval workflows,
            and admin controls.
          </p>
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Sign in to Explore
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-800/50">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between">
          <span className="text-sm text-zinc-600">
            Parallex Showcase — Portfolio Demo
          </span>
          <div className="flex gap-4 text-sm text-zinc-600">
            {featuredProjects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.slug}`}
                className="hover:text-zinc-400"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
