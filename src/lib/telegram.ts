const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: any,
  extraPayload?: any
) {
  try {
    const payload: any = {
      chat_id: chatId,
      text,
      ...extraPayload,
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return null;
  }
}

export async function editMessageText(
  chatId: number | string,
  messageId: number | string,
  text: string,
  replyMarkup?: any,
  extraPayload?: any
) {
  try {
    const payload: any = {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...extraPayload,
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(`${TELEGRAM_API}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (error) {
    console.error("Error editing Telegram message:", error);
    return null;
  }
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
) {
  try {
    const payload: any = {
      callback_query_id: callbackQueryId,
    };
    if (text) {
      payload.text = text;
    }

    const res = await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (error) {
    console.error("Error answering callback query:", error);
    return null;
  }
}

export function getFormattedDate(date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatToCardDate(isoDateStr?: string): string {
  if (!isoDateStr) return getFormattedDate();
  const parts = isoDateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return getFormattedDate(new Date(isoDateStr));
}

export function formatDevotionCard(dateStr: string, devotionRow?: any): string {
  return [
    "Personal Devotion -",
    dateStr,
    `Prayer Check (1 hour): ${devotionRow?.prayer_check ? "✅" : "⬜"}`,
    `Bible reading(5 chapters): ${devotionRow?.bible_check ? "✅" : "⬜"}`,
    `Track for the week: ${devotionRow?.weekly_track || "Not set"}`,
    `Book of the month page number: ${devotionRow?.book_page || "Not set"}`,
  ].join("\n");
}

export function getDevotionInlineKeyboard(devotionRow?: any) {
  return {
    inline_keyboard: [
      [
        {
          text: `🙏 Prayer (1hr) ${devotionRow?.prayer_check ? "✅" : "⬜"}`,
          callback_data: "toggle_prayer",
        },
        {
          text: `📖 Bible (5ch) ${devotionRow?.bible_check ? "✅" : "⬜"}`,
          callback_data: "toggle_bible",
        },
      ],
      [
        {
          text: "🎧 Set Track for the Week",
          callback_data: "prompt_track",
        },
        {
          text: "📚 Set Book Page #",
          callback_data: "prompt_book",
        },
      ],
      [
        {
          text: "✨ Complete & Get AI Insight",
          callback_data: "generate_ai",
        },
        {
          text: "📊 Dashboard Link",
          callback_data: "get_dashboard",
        },
      ],
    ],
  };
}

export function parseDevotionTemplate(input: string) {
  const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
  let prayer_check = false;
  let bible_check = false;
  let weekly_track = "";
  let book_page = "";

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("prayer check")) {
      prayer_check = line.includes("✅") || lower.includes("yes") || lower.includes("done");
    } else if (lower.includes("bible reading") || lower.includes("bible check")) {
      bible_check = line.includes("✅") || lower.includes("yes") || lower.includes("done");
    } else if (lower.startsWith("track for the week:")) {
      const val = line.substring("track for the week:".length).trim();
      weekly_track = val.toLowerCase() === "not set" ? "" : val;
    } else if (lower.startsWith("book of the month page number:")) {
      const val = line.substring("book of the month page number:".length).trim();
      book_page = val.toLowerCase() === "not set" ? "" : val;
    }
  }

  return { prayer_check, bible_check, weekly_track, book_page };
}
