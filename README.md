# Spiritual Growth Tracker

A serverless Telegram Bot and Web Dashboard for tracking daily spiritual disciplines:
- Prayer check (1 hour)
- Bible reading (5 chapters)
- Track for the week
- Book of the month page number

Built with Next.js 14, Tailwind CSS, Supabase PostgreSQL, Telegram Bot API, and Gemini 3.5 Flash Lite for asynchronous spiritual exhortation.

---

## 1. Supabase Database Setup

1. Open your [Supabase Dashboard](https://supabase.com).
2. Go to the SQL Editor.
3. Run the code from `supabase_schema.sql` to build the `users`, `daily_devotions`, `spiritual_logs`, and `auth_tokens` tables.
4. Copy your API keys from Project Settings.

---

## 2. Environment Variables

Set the following variables in Vercel:

| Variable | Description |
| :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | Token provided by @BotFather |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Public Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret |
| `NEXT_PUBLIC_APP_URL` | Live domain (e.g. `https://spiritual-tracker.vercel.app`) |
| `GEMINI_API_KEY` | API key from Google AI Studio for AI feedback generation |

The project relies on `@vercel/functions` for background execution. Vercel natively supports this package in App Router deployments.

---

## 3. Register Telegram Webhook

Once deployed, register your webhook by opening this URL in a browser:

```text
https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook?url=<YOUR_VERCEL_APP_URL>/api/webhook
```

Expected response:
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

---

## 4. Usage Guide

### Interactive Logging on Telegram
Send `/log` or `/start` to view today's interactive scorecard:
- Tap `🙏 Prayer (1hr)` or `📖 Bible (5ch)` to toggle your checklist status instantly.
- Tap `🎧 Set Track for the Week` or `📚 Set Book Page #` to reply with your notes.
- Tap `✨ Complete & Get AI Insight` to receive a spiritual exhortation from Gemini.
- Tap `📊 Dashboard Link` for instant passwordless web access.

### Template Logging
You can also paste the standard multi-line scorecard directly:

```text
Personal Devotion -
DD/MM/YYYY
Prayer Check (1 hour): ✅
Bible reading(5 chapters): ✅
Track for the week: Title or speaker
Book of the month page number: Page 45
```

The bot will parse each discipline and sync your scorecard in Supabase.

### Web Dashboard
Open the Magic Link sent from Telegram to view your role-gated dashboard (Member view for personal streaks and scorecard telemetry, Admin view for network cohort metrics).