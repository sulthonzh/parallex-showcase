import "server-only";

export function isAIEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function generateAssetTags(
  imageUrl: string,
): Promise<string[] | null> {
  if (!isAIEnabled()) return null;

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
            role: "user",
            content: [
              {
                type: "text",
                text: "List 5 short tags describing this real estate image. Return only comma-separated words.",
              },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 60,
      }),
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content as string;
    if (!text) return null;

    return text
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 5);
  } catch {
    return null;
  }
}

export async function generateProjectDescription(
  name: string,
  location: string,
  existingDescription?: string,
): Promise<string | null> {
  if (!isAIEnabled()) return null;

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
              "You are a luxury real estate copywriter. Write compelling, concise project descriptions.",
          },
          {
            role: "user",
            content: `Write a 2-sentence description for "${name}", a real estate project in ${location || "a prime location"}.${existingDescription ? ` Existing description: "${existingDescription}"` : ""}`,
          },
        ],
        max_tokens: 150,
      }),
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}
