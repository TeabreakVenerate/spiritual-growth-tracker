import { supabase } from "./supabase";

export interface InsightParams {
  logId: string;
  category: string;
  content: string;
  takeaway?: string | null;
}

export async function generateSpiritualInsight({ logId, category, content, takeaway }: InsightParams): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  let feedback = "Insight generation failed, but your devotion is recorded.";

  try {
    if (apiKey) {
      const prompt = `As a mature spiritual mentor, provide a concise, doctrinally sound 2-sentence feedback or exhortation for this devotion log.
Category: ${category}
Content: ${content}
Takeaway: ${takeaway || "None provided"}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          feedback = text.trim();
        }
      } else {
        console.error("Gemini API error:", await res.text());
      }
    }
  } catch (error) {
    console.error("Failed to generate spiritual insight:", error);
  }

  // Explicitly run Supabase UPDATE to save the string
  if (supabase) {
    await supabase
      .from("spiritual_logs")
      .update({ ai_feedback: feedback })
      .eq("id", logId);
  }

  return feedback;
}

export async function generateDailyDevotionInsight(devotionRow: any): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  let feedback = "Insight generation failed, but your devotion is recorded.";

  try {
    if (apiKey) {
      const prompt = `As a mature spiritual mentor, provide a concise, uplifting, and doctrinally sound 2-sentence exhortation and practical reflection based on this daily devotion scorecard.
Date: ${devotionRow?.log_date || "Today"}
Prayer Check (1 hour): ${devotionRow?.prayer_check ? "Completed" : "Pending"}
Bible reading (5 chapters): ${devotionRow?.bible_check ? "Completed" : "Pending"}
Track for the week: ${devotionRow?.weekly_track || "Not set"}
Book of the month page: ${devotionRow?.book_page || "Not set"}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          feedback = text.trim();
        }
      } else {
        console.error("Gemini API error:", await res.text());
      }
    }
  } catch (error) {
    console.error("Failed to generate devotion insight:", error);
  }

  // Explicitly run Supabase UPDATE on daily_devotions table
  if (supabase && devotionRow?.id) {
    await supabase
      .from("daily_devotions")
      .update({ ai_feedback: feedback })
      .eq("id", devotionRow.id);
  }

  return feedback;
}
