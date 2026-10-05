import { NextRequest, NextResponse } from "next/server";
import { supabase, SpiritualLog } from "@/lib/supabase";

export async function GET() {
  if (!supabase) {
    // Return sample data if database not connected yet
    return NextResponse.json({
      connected: false,
      logs: [
        {
          id: "demo-1",
          user_id: "demo",
          date: new Date().toISOString().split("T")[0],
          bible_chapters: "Romans 8",
          prayer_minutes: 60,
          prayer_focus: "Prophetic Prayer Contact",
          journal_entry: "Strong focus on walking in the spirit without condemnation.",
          lesson_learned: "The future is the accumulation of daily actions.",
          created_at: new Date().toISOString(),
        },
      ],
    });
  }

  const { data, error } = await supabase
    .from("spiritual_logs")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ connected: true, logs: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bible_chapters, prayer_minutes, journal_entry, lesson_learned, user_id } = body;

    const todayStr = new Date().toISOString().split("T")[0];
    const logEntry: SpiritualLog = {
      user_id: user_id || "web-user",
      date: todayStr,
      bible_chapters: bible_chapters || "Read",
      prayer_minutes: parseInt(prayer_minutes, 10) || 0,
      journal_entry: journal_entry || "",
      lesson_learned: lesson_learned || "",
    };

    if (!supabase) {
      return NextResponse.json({
        status: "saved_locally_unpersisted",
        message: "Supabase not connected, please add credentials in .env.local",
        entry: logEntry,
      });
    }

    const { data, error } = await supabase
      .from("spiritual_logs")
      .insert([logEntry])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "success", entry: data[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
