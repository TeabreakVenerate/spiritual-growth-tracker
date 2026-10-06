export interface InsightParams {
  category: string;
  content: string;
  takeaway?: string | null;
}

export async function generateSpiritualInsight({ category, content, takeaway }: InsightParams): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const prompt = `As a mature spiritual mentor, provide a concise, doctrinally sound 2-sentence feedback or exhortation for this devotion log.
Category: ${category}
Content: ${content}
Takeaway: ${takeaway || "None provided"}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      console.error("Gemini API error:", await res.text());
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return text ? text.trim() : null;
  } catch (error) {
    console.error("Failed to generate spiritual insight:", error);
    return null;
  }
}
