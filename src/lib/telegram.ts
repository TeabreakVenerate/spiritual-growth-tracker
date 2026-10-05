const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;


export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: any
) {
  try {
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
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

export function parseQuickLog(input: string) {
  // Expected formats:
  // 1. Pipe format: Bible Chapters | Prayer Minutes | Journal | Lesson
  // Example: Romans 8 | 60 | Focused morning prayer | Character before charisma
  // 2. Key-Value format:
  // Bible: Genesis 1-3
  // Prayer: 45
  // Journal: Good time
  // Lesson: God is faithful

  const parts = input.split("|").map((p) => p.trim());
  if (parts.length >= 2) {
    const bible_chapters = parts[0] || "None";
    const prayer_minutes = parseInt(parts[1].replace(/[^0-9]/g, ""), 10) || 0;
    const journal_entry = parts[2] || "";
    const lesson_learned = parts[3] || "";
    return { bible_chapters, prayer_minutes, journal_entry, lesson_learned };
  }

  // Check key-value format
  const lines = input.split("\n");
  let bible = "";
  let prayer = 0;
  let journal = "";
  let lesson = "";

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith("bible:") || lower.startsWith("scripture:")) {
      bible = line.substring(line.indexOf(":") + 1).trim();
    } else if (lower.startsWith("prayer:") || lower.startsWith("prayed:")) {
      const val = line.substring(line.indexOf(":") + 1).trim();
      prayer = parseInt(val.replace(/[^0-9]/g, ""), 10) || 0;
    } else if (lower.startsWith("journal:") || lower.startsWith("note:")) {
      journal = line.substring(line.indexOf(":") + 1).trim();
    } else if (lower.startsWith("lesson:") || lower.startsWith("takeaway:")) {
      lesson = line.substring(line.indexOf(":") + 1).trim();
    }
  }

  if (bible || prayer > 0) {
    return {
      bible_chapters: bible || "Recorded",
      prayer_minutes: prayer,
      journal_entry: journal,
      lesson_learned: lesson,
    };
  }

  return null;
}
