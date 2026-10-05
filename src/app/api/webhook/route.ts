import { NextRequest, NextResponse } from "next/server";
import { supabase, SpiritualLog } from "@/lib/supabase";
import { sendTelegramMessage, parseQuickLog } from "@/lib/telegram";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Spiritual Growth Tracker Telegram Webhook",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message || body.edited_message;

    if (!message || !message.text) {
      return NextResponse.json({ status: "ignored" });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const userId = String(message.from?.id || chatId);
    const todayStr = new Date().toISOString().split("T")[0];

    // Command: /start
    if (text === "/start") {
      const welcomeMsg = `🕊️ *Spiritual Growth Tracker Node*\n\n` +
        `Welcome to your dedicated spiritual discipline ledger.\n\n` +
        `*Quick Commands:*\n` +
        `• \`/today\` : View today's recorded devotion\n` +
        `• \`/streak\` : View active discipline streak\n` +
        `• \`/dashboard\` : Web dashboard link\n\n` +
        `*How to Log (Two Fast Options):*\n` +
        `1. *Pipe Format (Single Line):*\n` +
        `\`Romans 8 | 60 | Deep morning prayer | Discipline precedes ease\`\n\n` +
        `2. *Multi-Line Format:*\n` +
        `\`Bible: Genesis 1-3\`\n` +
        `\`Prayer: 60 mins\`\n` +
        `\`Journal: Peace during PPC\`\n` +
        `\`Lesson: The future is an accumulation of daily habits\``;

      await sendTelegramMessage(chatId, welcomeMsg, {
        keyboard: [
          [{ text: "/today" }, { text: "/streak" }],
          [{ text: "/help" }, { text: "/dashboard" }],
        ],
        resize_keyboard: true,
      });

      return NextResponse.json({ status: "ok" });
    }

    // Command: /help
    if (text === "/help") {
      const helpMsg = `📖 *Logging Syntax Guide*\n\n` +
        `To record your daily devotion, send a message in this format:\n\n` +
        `*<Bible Chapters> | <Prayer Minutes> | <Journal Reflection> | <Key Lesson>*\n\n` +
        `*Example:*\n` +
        `\`Romans 1-2 | 45 | Focused meditation | Right desires fuel clean discipline\`\n\n` +
        `Your entry will instantly write to your Supabase ledger and update your live web dashboard.`;

      await sendTelegramMessage(chatId, helpMsg);
      return NextResponse.json({ status: "ok" });
    }

    // Command: /dashboard
    if (text === "/dashboard") {
      const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-spiritual-tracker.vercel.app";
      await sendTelegramMessage(
        chatId,
        `📊 *Web Dashboard Access*\n\nAccess your live progress, logs, and habit trends here:\n${dashboardUrl}`
      );
      return NextResponse.json({ status: "ok" });
    }

    // Command: /today
    if (text === "/today") {
      if (!supabase) {
        await sendTelegramMessage(
          chatId,
          `⚠️ *Database Notice*: Supabase credentials not configured in environment variables.`
        );
        return NextResponse.json({ status: "ok" });
      }

      const { data, error } = await supabase
        .from("spiritual_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("date", todayStr)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Supabase query error:", error);
        await sendTelegramMessage(chatId, `❌ Error retrieving records.`);
        return NextResponse.json({ status: "error" });
      }

      if (!data || data.length === 0) {
        await sendTelegramMessage(
          chatId,
          `📅 *Today's Log (${todayStr})*: None recorded yet.\n\nSend a quick log to record today's devotion:\n\`Romans 8 | 60 | Notes... | Lesson...\``
        );
      } else {
        const item = data[0];
        const logMsg = `✅ *Today's Spiritual Record (${todayStr})*\n\n` +
          `📖 *Bible Chapters:* ${item.bible_chapters || "None"}\n` +
          `🙏 *Prayer Duration:* ${item.prayer_minutes} minutes\n` +
          `✍️ *Journal:* ${item.journal_entry || "No journal entry"}\n` +
          `💡 *Key Lesson:* ${item.lesson_learned || "No lesson noted"}`;
        await sendTelegramMessage(chatId, logMsg);
      }
      return NextResponse.json({ status: "ok" });
    }

    // Command: /streak
    if (text === "/streak") {
      if (!supabase) {
        await sendTelegramMessage(chatId, `⚠️ Database not configured.`);
        return NextResponse.json({ status: "ok" });
      }

      const { data, error } = await supabase
        .from("spiritual_logs")
        .select("date")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (error || !data) {
        await sendTelegramMessage(chatId, `❌ Could not calculate streak.`);
        return NextResponse.json({ status: "error" });
      }

      const uniqueDates = Array.from(new Set(data.map((d: any) => d.date)));
      let streak = 0;
      let checkDate = new Date();

      for (const dStr of uniqueDates) {
        const entryDate = new Date(dStr);
        const diffDays = Math.floor(
          (checkDate.getTime() - entryDate.getTime()) / (1000 * 3600 * 24)
        );
        if (diffDays <= 1) {
          streak++;
          checkDate = entryDate;
        } else {
          break;
        }
      }

      await sendTelegramMessage(
        chatId,
        `🔥 *Discipline Streak*: ${streak} consecutive day(s) recorded.\n\nKeep the morning altar burning.`
      );
      return NextResponse.json({ status: "ok" });
    }

    // Attempt parsing custom log
    const parsed = parseQuickLog(text);
    if (!parsed) {
      await sendTelegramMessage(
        chatId,
        `❓ *Unrecognized Format*\n\nTo log, use the pipe format:\n\`Romans 8 | 60 | Journal notes | Key lesson\`\n\nOr type /help for details.`
      );
      return NextResponse.json({ status: "ok" });
    }

    const logEntry: SpiritualLog = {
      user_id: userId,
      date: todayStr,
      bible_chapters: parsed.bible_chapters,
      prayer_minutes: parsed.prayer_minutes,
      journal_entry: parsed.journal_entry,
      lesson_learned: parsed.lesson_learned,
    };

    if (supabase) {
      const { error } = await supabase.from("spiritual_logs").insert([logEntry]);
      if (error) {
        console.error("Supabase insert error:", error);
        await sendTelegramMessage(
          chatId,
          `⚠️ Log received, but database write failed: ${error.message}`
        );
        return NextResponse.json({ status: "db_error" });
      }
    }

    const confirmationMsg = `✅ *Spiritual Record Saved (${todayStr})*\n\n` +
      `📖 *Bible:* ${parsed.bible_chapters}\n` +
      `🙏 *Prayer:* ${parsed.prayer_minutes} mins\n` +
      (parsed.journal_entry ? `✍️ *Journal:* ${parsed.journal_entry}\n` : "") +
      (parsed.lesson_learned ? `💡 *Lesson:* ${parsed.lesson_learned}\n` : "") +
      `\nView your progress on the live dashboard.`;

    await sendTelegramMessage(chatId, confirmationMsg);
    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
