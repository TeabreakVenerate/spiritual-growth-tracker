import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  sendTelegramMessage,
  editMessageText,
  answerCallbackQuery,
  formatDevotionCard,
  getDevotionInlineKeyboard,
  parseDevotionTemplate,
  formatToCardDate,
} from "@/lib/telegram";
import { generateSpiritualInsight, generateDailyDevotionInsight } from "@/lib/ai";
import { waitUntil } from "@vercel/functions";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Spiritual Growth Tracker Telegram Webhook (Interactive)",
    timestamp: new Date().toISOString(),
  });
}

// Background AI execution for daily devotion scorecard
async function processDevotionAiInsight(devotionRow: any, chatId: number | string) {
  try {
    const feedback = await generateDailyDevotionInsight(devotionRow);
    if (feedback) {
      await sendTelegramMessage(chatId, `✨ *Spiritual Exhortation*\n\n${feedback}`);
    }
  } catch (error) {
    console.error("Devotion AI Pipeline Error:", error);
  }
}

// Background AI execution for legacy logs
async function processAiInsight(logId: string, category: string, content: string, chatId: number | string) {
  try {
    const feedback = await generateSpiritualInsight({ logId, category, content });
    if (feedback) {
      await sendTelegramMessage(chatId, `💡 *Synthesis:*\n${feedback}`);
    }
  } catch (error) {
    console.error("AI Pipeline Error:", error);
  }
}

// Helper: Ensure user exists in users table
async function upsertUser(userId: number | string, firstName: string, username: string) {
  if (!supabase) return;
  await supabase
    .from("users")
    .upsert(
      {
        id: userId,
        first_name: firstName,
        username: username,
      },
      { onConflict: "id" }
    );
}

// Helper: Fetch or create today's daily devotion record
async function getOrCreateTodayDevotion(userId: number | string) {
  const todayStr = new Date().toISOString().split("T")[0];
  if (!supabase) return { devotionRow: null, todayStr };

  const { data: existing } = await supabase
    .from("daily_devotions")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", todayStr)
    .maybeSingle();

  if (existing) {
    return { devotionRow: existing, todayStr };
  }

  const { data: inserted, error } = await supabase
    .from("daily_devotions")
    .upsert(
      {
        user_id: userId,
        log_date: todayStr,
        prayer_check: false,
        bible_check: false,
        weekly_track: "",
        book_page: "",
      },
      { onConflict: "user_id,log_date" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error creating today devotion record:", error);
  }

  return { devotionRow: inserted, todayStr };
}

// Helper: Generate and send Magic Link
async function sendDashboardMagicLink(userId: number | string, chatId: number | string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60000).toISOString(); // 15 mins

  if (supabase) {
    const { error } = await supabase
      .from("auth_tokens")
      .insert({ user_id: userId, token, expires_at: expiresAt });

    if (error) {
      console.error("Token generation error:", error);
      await sendTelegramMessage(chatId, "⚠️ Failed to generate secure dashboard link.");
      return;
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await sendTelegramMessage(
    chatId,
    `🔐 *Dashboard Access*\n\nYour secure, one-time magic link (expires in 15 mins):\n${appUrl}/api/auth/verify?token=${token}`,
    undefined,
    { link_preview_options: { is_disabled: true } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // -------------------------------------------------------------
    // 1. Handle Callback Query (Interactive Button Clicks)
    // -------------------------------------------------------------
    if (body?.callback_query) {
      const cb = body.callback_query;
      const callbackQueryId = cb.id;
      const tgUser = cb.from;
      const userId = tgUser?.id;
      const firstName = tgUser?.first_name || "";
      const username = tgUser?.username || "";
      const chatId = cb.message?.chat?.id;
      const messageId = cb.message?.message_id;
      const data = cb.data;

      if (!userId || !chatId) {
        return NextResponse.json({ status: "ignored" });
      }

      await upsertUser(userId, firstName, username);
      const { devotionRow, todayStr } = await getOrCreateTodayDevotion(userId);
      const cardDate = formatToCardDate(todayStr);

      if (data === "toggle_prayer") {
        const newPrayer = !devotionRow?.prayer_check;
        let updatedRow = devotionRow;

        if (supabase && devotionRow?.id) {
          const { data: updated } = await supabase
            .from("daily_devotions")
            .update({
              prayer_check: newPrayer,
              updated_at: new Date().toISOString(),
            })
            .eq("id", devotionRow.id)
            .select()
            .single();

          if (updated) updatedRow = updated;
        }

        await answerCallbackQuery(callbackQueryId, newPrayer ? "Prayer check: Completed" : "Prayer check: Pending");
        await editMessageText(
          chatId,
          messageId,
          formatDevotionCard(cardDate, updatedRow),
          getDevotionInlineKeyboard(updatedRow)
        );
        return NextResponse.json({ status: "ok" });
      }

      if (data === "toggle_bible") {
        const newBible = !devotionRow?.bible_check;
        let updatedRow = devotionRow;

        if (supabase && devotionRow?.id) {
          const { data: updated } = await supabase
            .from("daily_devotions")
            .update({
              bible_check: newBible,
              updated_at: new Date().toISOString(),
            })
            .eq("id", devotionRow.id)
            .select()
            .single();

          if (updated) updatedRow = updated;
        }

        await answerCallbackQuery(callbackQueryId, newBible ? "Bible reading: Completed" : "Bible reading: Pending");
        await editMessageText(
          chatId,
          messageId,
          formatDevotionCard(cardDate, updatedRow),
          getDevotionInlineKeyboard(updatedRow)
        );
        return NextResponse.json({ status: "ok" });
      }

      if (data === "prompt_track") {
        if (supabase) {
          await supabase
            .from("users")
            .update({ pending_action: "awaiting_track" })
            .eq("id", userId);
        }
        await answerCallbackQuery(callbackQueryId);
        await sendTelegramMessage(
          chatId,
          "🎧 Please reply with your Track for the Week (e.g. Message title, speaker, or link):"
        );
        return NextResponse.json({ status: "ok" });
      }

      if (data === "prompt_book") {
        if (supabase) {
          await supabase
            .from("users")
            .update({ pending_action: "awaiting_book" })
            .eq("id", userId);
        }
        await answerCallbackQuery(callbackQueryId);
        await sendTelegramMessage(
          chatId,
          "📚 Please reply with your Book of the Month page number (e.g. Page 45 or Chapters 3-4):"
        );
        return NextResponse.json({ status: "ok" });
      }

      if (data === "generate_ai") {
        await answerCallbackQuery(callbackQueryId, "Synthesizing insight...");
        if (devotionRow) {
          waitUntil(processDevotionAiInsight(devotionRow, chatId));
        }
        return NextResponse.json({ status: "ok" });
      }

      if (data === "get_dashboard") {
        await answerCallbackQuery(callbackQueryId, "Generating link...");
        await sendDashboardMagicLink(userId, chatId);
        return NextResponse.json({ status: "ok" });
      }

      await answerCallbackQuery(callbackQueryId);
      return NextResponse.json({ status: "ok" });
    }

    // -------------------------------------------------------------
    // 2. Handle Text Messages
    // -------------------------------------------------------------
    const message = body?.message || body?.edited_message;
    if (!message || !message.text) {
      return NextResponse.json({ status: "ignored" });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const tgUser = message.from;

    if (!tgUser) {
      return NextResponse.json({ status: "ignored" });
    }

    const userId = tgUser.id;
    const firstName = tgUser.first_name || "";
    const username = tgUser.username || "";

    await upsertUser(userId, firstName, username);

    const { devotionRow, todayStr } = await getOrCreateTodayDevotion(userId);
    const cardDate = formatToCardDate(todayStr);

    // Check if user has an active pending_action state
    if (supabase) {
      const { data: userRecord } = await supabase
        .from("users")
        .select("pending_action")
        .eq("id", userId)
        .single();

      if (userRecord?.pending_action === "awaiting_track") {
        const { data: updated } = await supabase
          .from("daily_devotions")
          .update({
            weekly_track: text,
            updated_at: new Date().toISOString(),
          })
          .eq("id", devotionRow?.id)
          .select()
          .single();

        await supabase
          .from("users")
          .update({ pending_action: null })
          .eq("id", userId);

        const activeRow = updated || devotionRow;
        await sendTelegramMessage(
          chatId,
          `✅ *Track Updated!*\n\n${formatDevotionCard(cardDate, activeRow)}`,
          getDevotionInlineKeyboard(activeRow)
        );
        return NextResponse.json({ status: "ok" });
      }

      if (userRecord?.pending_action === "awaiting_book") {
        const { data: updated } = await supabase
          .from("daily_devotions")
          .update({
            book_page: text,
            updated_at: new Date().toISOString(),
          })
          .eq("id", devotionRow?.id)
          .select()
          .single();

        await supabase
          .from("users")
          .update({ pending_action: null })
          .eq("id", userId);

        const activeRow = updated || devotionRow;
        await sendTelegramMessage(
          chatId,
          `✅ *Book Page Updated!*\n\n${formatDevotionCard(cardDate, activeRow)}`,
          getDevotionInlineKeyboard(activeRow)
        );
        return NextResponse.json({ status: "ok" });
      }
    }

    // Template Text Parser (Raw pasted scorecard)
    if (text.toLowerCase().startsWith("personal devotion")) {
      const parsed = parseDevotionTemplate(text);
      let updatedRow = devotionRow;

      if (supabase && devotionRow?.id) {
        const { data: updated } = await supabase
          .from("daily_devotions")
          .update({
            prayer_check: parsed.prayer_check,
            bible_check: parsed.bible_check,
            weekly_track: parsed.weekly_track || devotionRow.weekly_track,
            book_page: parsed.book_page || devotionRow.book_page,
            updated_at: new Date().toISOString(),
          })
          .eq("id", devotionRow.id)
          .select()
          .single();

        if (updated) updatedRow = updated;
      }

      await sendTelegramMessage(
        chatId,
        `📋 *Scorecard Ingested Successfully*\n\n${formatDevotionCard(cardDate, updatedRow)}`,
        getDevotionInlineKeyboard(updatedRow)
      );
      return NextResponse.json({ status: "ok" });
    }

    // Direct Commands
    if (
      text.startsWith("/start") ||
      text.startsWith("/log") ||
      text.startsWith("/today") ||
      text.startsWith("/checklist")
    ) {
      await sendTelegramMessage(
        chatId,
        formatDevotionCard(cardDate, devotionRow),
        getDevotionInlineKeyboard(devotionRow)
      );
      return NextResponse.json({ status: "ok" });
    }

    if (text.startsWith("/dashboard")) {
      await sendDashboardMagicLink(userId, chatId);
      return NextResponse.json({ status: "ok" });
    }

    // Legacy Slash Commands Support (/biblestudy, /prayer, /sermon, /book)
    if (
      text.startsWith("/biblestudy") ||
      text.startsWith("/prayer") ||
      text.startsWith("/sermon") ||
      text.startsWith("/book")
    ) {
      let category = "";
      let content = "";

      if (text.startsWith("/biblestudy")) {
        category = "biblestudy";
        content = text.replace("/biblestudy", "").trim();
      } else if (text.startsWith("/prayer")) {
        category = "prayer";
        content = text.replace("/prayer", "").trim();
      } else if (text.startsWith("/sermon")) {
        category = "sermon";
        content = text.replace("/sermon", "").trim();
      } else if (text.startsWith("/book")) {
        category = "book";
        content = text.replace("/book", "").trim();
      }

      if (!content) {
        await sendTelegramMessage(
          chatId,
          `Please provide your notes after the command.\n\nExample:\n\`/${category} Key revelations from today's session.\``
        );
        return NextResponse.json({ status: "ok" });
      }

      let insertedLogId = null;
      if (supabase) {
        const { data, error } = await supabase
          .from("spiritual_logs")
          .insert({
            user_id: userId,
            category: category,
            content: content,
          })
          .select("id")
          .single();

        if (!error && data) {
          insertedLogId = data.id;
        }
      }

      const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);
      await sendTelegramMessage(chatId, `✅ *${displayCategory} Logged*\n\n_Synthesis engine processing..._`);

      if (insertedLogId) {
        waitUntil(processAiInsight(insertedLogId, category, content, chatId));
      }

      return NextResponse.json({ status: "ok" });
    }

    // Default fallback: Surface the interactive devotion card
    await sendTelegramMessage(
      chatId,
      formatDevotionCard(cardDate, devotionRow),
      getDevotionInlineKeyboard(devotionRow)
    );
    return NextResponse.json({ status: "ok" });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
