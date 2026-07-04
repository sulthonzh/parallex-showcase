import { redirect } from "next/navigation";
import { validateShareLink } from "@/modules/broker/server";
import { trackEvent } from "@/modules/analytics/track";

export const dynamic = "force-dynamic";

export default async function ShareLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await validateShareLink(token);

  if (!result.ok) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold mb-2">Link Unavailable</h1>
          <p className="text-muted-foreground">{result.error}</p>
        </div>
      </main>
    );
  }

  void trackEvent(result.value.projectId, "view", { shareLinkToken: token });

  redirect(`/projects/${result.value.slug}`);
}
