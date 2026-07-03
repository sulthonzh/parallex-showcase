export default async function PublicHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-semibold">Project: {slug}</h1>
      <p className="mt-4 text-muted-foreground">
        Cinematic interactive hub lands here in Phase 2.
      </p>
    </main>
  );
}
