export default async function ShareLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-semibold">Share link: {token}</h1>
      <p className="mt-4 text-muted-foreground">
        Scoped share-link entry lands here in Phase 2.
      </p>
    </main>
  );
}
