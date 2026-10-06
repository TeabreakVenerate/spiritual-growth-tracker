import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendTelegramMessage } from "@/lib/telegram";
import { generateSpiritualInsight } from "@/lib/ai";
import { waitUntil } from "@vercel/functions";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Spiritual Growth Tracker Telegram Webhook (Multi-Tenant)",
    timestamp: new Date().toISOString(),
  });
}

// Background fire-and-forget function
// We do not await this in the main POST handler to avoid blocking Telegram's 200 OK.
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message || body.edited_message;

    if (!message || !message.text) {
      return NextResponse.json({ status: "ignored" });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const tgUser = message.from;

    if (!tgUser) {
      return NextResponse.json({ status: "ignored" });
    }

    // 1. Extract Identity
    const userId = tgUser.id; // Telegram user ID (BigInt)
    const firstName = tgUser.first_name || "";
    const username = tgUser.username || "";

    // 2. User Upsert (Multi-Tenant Registration)
    if (supabase) {
      const { error: upsertError } = await supabase
        .from("users")
        .upsert(
          {
            id: userId,
            first_name: firstName,
            username: username,
            // role defaults to 'member' in DB
          },
          { onConflict: "id" }
        );

      if (upsertError) {
        console.error("User upsert error:", upsertError);
      }
    }

    // 3. Command Parsing & Routing
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
    } else if (text.startsWith("/dashboard")) {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60000).toISOString(); // 15 mins
      
      if (supabase) {
        const { error } = await supabase
          .from("auth_tokens")
          .insert({ user_id: userId, token, expires_at: expiresAt });
          
        if (error) {
          console.error("Token generation error:", error);
          await sendTelegramMessage(chatId, "⚠️ Failed to generate secure dashboard link.");
          return NextResponse.json({ status: "error" });
        }
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendTelegramMessage(
        chatId,
        `🔐 *Dashboard Access*\n\nYour secure, one-time magic link (expires in 15 mins):\n${appUrl}/api/auth/verify?token=${token}`,
        undefined,
        { link_preview_options: { is_disabled: true } }
      );
      return NextResponse.json({ status: "ok" });
    } else if (text.startsWith("/start") || text.startsWith("/help")) {
      await sendTelegramMessage(
        chatId,
        `🕊️ *Spiritual Growth Tracker*\n\nSend your devotions using these commands:\n\n• \`/biblestudy [notes]\`\n• \`/prayer [notes]\`\n• \`/sermon [notes]\`\n• \`/book [notes]\``
      );
      return NextResponse.json({ status: "ok" });
    } else {
      await sendTelegramMessage(
        chatId,
        "Unrecognized format. Please start your message with /biblestudy, /prayer, /sermon, or /book."
      );
      return NextResponse.json({ status: "ok" });
    }

    if (!content) {
      await sendTelegramMessage(
        chatId,
        `Please provide your notes after the command.\n\nExample:\n\`/${category} Romans 8 was incredible today. The mind governed by the Spirit is life and peace.\``
      );
      return NextResponse.json({ status: "ok" });
    }

    // 4. Database Insertion
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

      if (error) {
        console.error("Log insert error:", error);
        await sendTelegramMessage(chatId, "⚠️ Failed to save log entry to database.");
        return NextResponse.json({ status: "error" });
      }

      if (data) {
        insertedLogId = data.id;
      }
    }

    // Immediate confirmation to user
    const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);
    await sendTelegramMessage(chatId, `✅ *${displayCategory} Logged*\n\n_Synthesis engine processing..._`);

    // 5. Implement Async AI Trigger
    if (insertedLogId) {
      // Wrapped in waitUntil to keep Vercel lambda alive
      waitUntil(processAiInsight(insertedLogId, category, content, chatId));
    }

    // CRITICAL: Return 200 OK immediately, without waiting for processAiInsight
    return NextResponse.json({ status: "ok" });

  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
