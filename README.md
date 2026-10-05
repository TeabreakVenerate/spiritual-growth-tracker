# Spiritual Growth Tracker

A serverless Telegram Bot and Web Dashboard built for tracking daily spiritual disciplines:
- **Bible Chapters Read**
- **Prayer Duration (Minutes)**
- **Journal Reflections**
- **Core Lessons / Takeaways**

Built with **Next.js 14**, **Tailwind CSS**, **Supabase**, and the **Telegram Bot API**. Optimized for zero-cost deployment on Vercel.

---

## 1. Supabase Database Setup

1. Open your [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor**.
3. Copy and run the code from `supabase_schema.sql`.
4. Navigate to **Project Settings -> API** and copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Deploy to Vercel

### Environment Variables
Set the following in your Vercel Project Settings:

| Variable | Description |
| :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | Token provided by @BotFather |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Public Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret |
| `NEXT_PUBLIC_APP_URL` | Your live Vercel domain (e.g. `https://spiritual-tracker.vercel.app`) |

---

## 3. Register Telegram Webhook

Once your Vercel deployment is live, open this URL in your browser:

```text
https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<YOUR_VERCEL_APP_URL>/api/webhook
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

### Logging on Telegram
Send a single message using the pipe format:

```text
Romans 8 | 60 | Focused prayer during PPC | The future is an accumulation of daily habits
```

Or using multi-line format:

```text
Bible: Romans 8
Prayer: 60 mins
Journal: Peace during devotion
Lesson: Right desires fuel clean discipline
```

### Supported Bot Commands
- `/start` : Opens main menu and keyboard shortcuts.
- `/today` : Fetches today's recorded devotion.
- `/streak` : Calculates consecutive days of altar consistency.
- `/dashboard` : Sends link to the web dashboard.
- `/help` : Displays syntax instructions.

---

## 5. Web Dashboard Features
- Live consistency streak counter.
- Cumulative prayer hours calculated across records.
- Daily check-in status (Completed vs Pending).
- Historical timeline feed with filterable cards.
- Desktop manual entry modal for logging directly from your laptop.