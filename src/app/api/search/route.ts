import { NextRequest, NextResponse } from "next/server";
import { ilike, or, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, assets, units } from "@/lib/schema";
import { isAIEnabled } from "@/lib/ai";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], ai: false });
  }

  const aiEnabled = isAIEnabled();
  let query = q;

  if (aiEnabled) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Extract the most relevant search keywords from the user's real estate query. Return only the keywords, comma-separated, max 5.",
            },
            { role: "user", content: q },
          ],
          max_tokens: 40,
        }),
      });
      const data = await res.json();
      const keywords = data.choices?.[0]?.message?.content as string;
      if (keywords) query = keywords.split(",")[0]?.trim() || q;
    } catch {
      query = q;
    }
  }

  const projectResults = await db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      type: sql<string>`'project'`,
      location: projects.location,
    })
    .from(projects)
    .where(
      or(
        ilike(projects.name, `%${query}%`),
        ilike(projects.description, `%${query}%`),
        ilike(projects.location, `%${query}%`),
      ),
    )
    .limit(10);

  return NextResponse.json({ results: projectResults, ai: aiEnabled });
}
