"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Flame, Clock, PenTool, Lightbulb, CheckCircle2, AlertCircle, Plus, Send, ExternalLink } from "lucide-react";

interface LogItem {
  id?: string;
  date: string;
  bible_chapters: string;
  prayer_minutes: number;
  journal_entry?: string;
  lesson_learned?: string;
  created_at?: string;
}

export default function Dashboard() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [bible, setBible] = useState("");
  const [prayer, setPrayer] = useState("60");
  const [journal, setJournal] = useState("");
  const [lesson, setLesson] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      setConnected(Boolean(data.connected));
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bible_chapters: bible,
          prayer_minutes: prayer,
          journal_entry: journal,
          lesson_learned: lesson,
        }),
      });
      const data = await res.json();
      if (data.entry || data.status === "success") {
        setShowModal(false);
        setBible("");
        setJournal("");
        setLesson("");
        await fetchLogs();
      }
    } catch (err) {
      console.error("Failed to save log:", err);
    } finally {
      setSubmitting(false);
    }
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const todayEntry = logs.find((l) => l.date === todayStr);

  const totalPrayerMinutes = logs.reduce((acc, curr) => acc + (Number(curr.prayer_minutes) || 0), 0);
  const totalPrayerHours = (totalPrayerMinutes / 60).toFixed(1);

  // Calculate streak
  const uniqueDates = Array.from(new Set(logs.map((l) => l.date)));
  let streak = 0;
  let checkDate = new Date();
  for (const dStr of uniqueDates) {
    const entryDate = new Date(dStr);
    const diffDays = Math.floor((checkDate.getTime() - entryDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 1) {
      streak++;
      checkDate = entryDate;
    } else {
      break;
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              The Altar Ledger
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Covenant Discipline OS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Spiritual Growth Tracker</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Personal discipline telemetry for Scripture reading, prayer consistency, and cognitive renewal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#0F3D70] hover:bg-[#1E5AA0] text-white transition shadow-sm border border-blue-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>Log Devotion</span>
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-6">
        <div className="bg-[#0b1626] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Consistency Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white">{streak}</span>
            <span className="text-xs text-slate-400 ml-1">days</span>
          </div>
        </div>

        <div className="bg-[#0b1626] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Prayer Time</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white">{totalPrayerHours}</span>
            <span className="text-xs text-slate-400 ml-1">hours total</span>
          </div>
        </div>

        <div className="bg-[#0b1626] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Logs</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white">{logs.length}</span>
            <span className="text-xs text-slate-400 ml-1">entries</span>
          </div>
        </div>

        <div className="bg-[#0b1626] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Telegram Node</span>
            <Send className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs font-semibold text-emerald-400">Live Webhook</span>
          </div>
        </div>
      </div>

      {/* Today's Status Banner */}
      <div className={`p-4 rounded-xl border mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        todayEntry
          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
          : "bg-amber-950/20 border-amber-500/30 text-amber-200"
      }`}>
        <div className="flex items-center gap-3">
          {todayEntry ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <div>
            <div className="text-sm font-bold">
              {todayEntry ? "Today's Devotion Altar Maintained" : "Today's Altar Pending"}
            </div>
            <div className="text-xs opacity-80 mt-0.5">
              {todayEntry
                ? `Logged: ${todayEntry.bible_chapters} (${todayEntry.prayer_minutes} mins prayer)`
                : "Record your Bible study, prayer duration, and journaling for today."}
            </div>
          </div>
        </div>

        {!todayEntry && (
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1 rounded text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 transition shrink-0"
          >
            Quick Check-In
          </button>
        )}
      </div>

      {/* Quick Telegram Reference */}
      <div className="bg-[#0b1626] border border-slate-800 rounded-xl p-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span>⚡ Telegram Fast Logging Format</span>
          </div>
          <span className="text-[11px] text-slate-400">Send to your bot anytime</span>
        </div>
        <div className="bg-[#060d17] p-3 rounded-lg border border-slate-800 font-mono text-xs text-blue-300 overflow-x-auto">
          Romans 8 | 60 | Focused prayer during PPC | The future is the accumulation of daily actions
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Format: <code>&lt;Chapters&gt; | &lt;Minutes&gt; | &lt;Journal&gt; | &lt;Lesson&gt;</code>. Instant syncs to this dashboard.
        </p>
      </div>

      {/* Timeline Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Recent Spiritual Records</span>
            <span className="text-xs text-slate-400 font-normal">({logs.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading ledger records...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            No entries yet. Send your first log via Telegram or click 'Log Devotion'.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-[#0b1626] border border-slate-800 hover:border-slate-700 transition p-4 sm:p-5 rounded-xl text-xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-sm">{item.date}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold text-[11px] border border-blue-500/20">
                      📖 {item.bible_chapters}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[11px] border border-emerald-500/20">
                      🙏 {item.prayer_minutes} mins
                    </span>
                  </div>
                </div>

                {item.journal_entry && (
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Journal Reflection:</div>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">{item.journal_entry}</p>
                  </div>
                )}

                {item.lesson_learned && (
                  <div className="bg-[#081525] border-l-2 border-amber-400 p-2.5 rounded-r text-[11px]">
                    <div className="font-bold text-amber-300 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>Key Takeaway:</span>
                    </div>
                    <div className="text-slate-300 mt-0.5">{item.lesson_learned}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Manual Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b1626] border border-slate-700 rounded-xl max-w-md w-full p-6 text-xs space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-400" />
                <span>Log Daily Devotion</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Bible Chapters Read</label>
                <input
                  type="text"
                  placeholder="e.g. Romans 8, Genesis 1-3"
                  value={bible}
                  onChange={(e) => setBible(e.target.value)}
                  required
                  className="w-full bg-[#060d17] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Prayer Duration (Minutes)</label>
                <input
                  type="number"
                  placeholder="e.g. 60"
                  value={prayer}
                  onChange={(e) => setPrayer(e.target.value)}
                  required
                  className="w-full bg-[#060d17] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Journal Reflection</label>
                <textarea
                  rows={3}
                  placeholder="What was on your heart during prayer or study?"
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  className="w-full bg-[#060d17] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Key Principle / Lesson Learned</label>
                <input
                  type="text"
                  placeholder="One sentence core principle"
                  value={lesson}
                  onChange={(e) => setLesson(e.target.value)}
                  className="w-full bg-[#060d17] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded bg-[#0F3D70] hover:bg-[#1E5AA0] text-white font-semibold transition"
                >
                  {submitting ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
