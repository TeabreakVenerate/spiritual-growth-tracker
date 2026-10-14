import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import {
  Flame,
  Clock,
  BookOpen,
  ShieldAlert,
  Users,
  LayoutDashboard,
  Lightbulb,
  Headphones,
  CheckCircle2,
  Circle,
} from "lucide-react";
import React from "react";
import { formatToCardDate } from "@/lib/telegram";

export const dynamic = "force-dynamic";

interface DailyDevotion {
  id: string;
  user_id: number;
  log_date: string;
  prayer_check: boolean;
  bible_check: boolean;
  weekly_track: string;
  book_page: string;
  ai_feedback?: string | null;
  updated_at: string;
}

export default async function DashboardPage() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("auth_session");

  if (!sessionCookie || !sessionCookie.value) {
    return (
      <div className="min-h-screen bg-[#060d17] flex items-center justify-center p-4">
        <div className="bg-[#0b1626] border border-slate-800 p-8 rounded-xl max-w-md w-full text-center">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-sm text-slate-400 mb-6">
            Please use Telegram to request a secure magic link by sending the{" "}
            <code className="text-amber-400 font-mono">/dashboard</code> command to the bot.
          </p>
        </div>
      </div>
    );
  }

  const session = JSON.parse(sessionCookie.value);
  const userId = session.user_id;

  if (!supabase) {
    return <div className="min-h-screen bg-[#060d17] text-white p-8">Database not configured.</div>;
  }

  // Fetch live user role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  const role = userData?.role || "member";

  let devotions: DailyDevotion[] = [];
  let userCount = 0;

  if (role === "admin") {
    const { data } = await supabase
      .from("daily_devotions")
      .select("*")
      .order("log_date", { ascending: false })
      .limit(100);
    devotions = (data as DailyDevotion[]) || [];

    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });
    userCount = count || 0;
  } else {
    const { data } = await supabase
      .from("daily_devotions")
      .select("*")
      .eq("user_id", userId)
      .order("log_date", { ascending: false });
    devotions = (data as DailyDevotion[]) || [];
  }

  // Calculate Metrics
  const totalDevotions = devotions.length;
  const completedPrayerCount = devotions.filter((d) => d?.prayer_check).length;
  const completedBibleCount = devotions.filter((d) => d?.bible_check).length;

  // Member Streak calculation
  let streak = 0;
  if (role === "member") {
    const sortedDates = Array.from(
      new Set(
        devotions
          .filter((d) => d?.prayer_check || d?.bible_check)
          .map((d) => d?.log_date)
          .filter(Boolean)
      )
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let checkDate = new Date();
    for (const dStr of sortedDates) {
      if (!dStr) continue;
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
  }

  return (
    <div className="min-h-screen bg-[#060d17] text-white selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#0F3D70]/30 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                {role === "admin" ? "Cohort Oversight" : "The Daily Scorecard"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {role === "admin" ? "Admin Oversight" : "Spiritual Growth Tracker"}
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#0b1626] px-3 py-1.5 rounded-lg border border-slate-800 shadow-sm">
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>
              Role: <span className="text-white font-medium capitalize">{role}</span>
            </span>
          </div>
        </header>

        {/* Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
          {role === "admin" ? (
            <>
              <MetricCard
                title="Active Members"
                value={userCount}
                icon={<Users className="w-4 h-4 text-blue-400" />}
              />
              <MetricCard
                title="Total Scorecards"
                value={totalDevotions}
                icon={<BookOpen className="w-4 h-4 text-amber-400" />}
              />
              <MetricCard
                title="Prayer Checks"
                value={completedPrayerCount}
                icon={<Clock className="w-4 h-4 text-emerald-400" />}
              />
              <MetricCard
                title="Bible Checks"
                value={completedBibleCount}
                icon={<BookOpen className="w-4 h-4 text-purple-400" />}
              />
            </>
          ) : (
            <>
              <MetricCard
                title="Active Streak"
                value={`${streak} Days`}
                icon={<Flame className="w-4 h-4 text-amber-400" />}
              />
              <MetricCard
                title="Prayer (1hr)"
                value={`${completedPrayerCount} Done`}
                icon={<Clock className="w-4 h-4 text-emerald-400" />}
              />
              <MetricCard
                title="Bible (5ch)"
                value={`${completedBibleCount} Done`}
                icon={<BookOpen className="w-4 h-4 text-blue-400" />}
              />
              <MetricCard
                title="Scorecards"
                value={totalDevotions}
                icon={<CheckCircle2 className="w-4 h-4 text-purple-400" />}
              />
            </>
          )}
        </div>

        {/* Scorecard Feed Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              {role === "admin" ? "Live Cohort Scorecard Feed" : "Your Historical Scorecards"}
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {devotions.length} entries recorded
            </span>
          </div>

          {devotions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-[#0b1626] border border-dashed border-slate-800 rounded-xl text-sm">
              No daily devotion scorecards recorded yet. Tap /log in Telegram to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {devotions.map((devotion) => (
                <div
                  key={devotion?.id}
                  className="bg-[#0b1626] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition duration-200"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-200">
                        {formatToCardDate(devotion?.log_date)}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#0F3D70]/30 text-blue-300 font-mono text-[11px] border border-blue-500/20">
                        Daily Scorecard
                      </span>
                    </div>

                    {role === "admin" && (
                      <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                        UID: {devotion?.user_id?.toString().slice(-4)}
                      </span>
                    )}
                  </div>

                  {/* Checklist Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${
                        devotion?.prayer_check
                          ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                          : "bg-slate-900/40 border-slate-800 text-slate-500"
                      }`}
                    >
                      {devotion?.prayer_check ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600" />
                      )}
                      <span>Prayer Check (1 hour): {devotion?.prayer_check ? "Completed" : "Pending"}</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${
                        devotion?.bible_check
                          ? "bg-blue-950/20 border-blue-800/40 text-blue-300"
                          : "bg-slate-900/40 border-slate-800 text-slate-500"
                      }`}
                    >
                      {devotion?.bible_check ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600" />
                      )}
                      <span>Bible Reading (5 chapters): {devotion?.bible_check ? "Completed" : "Pending"}</span>
                    </div>
                  </div>

                  {/* Track and Book Page Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
                    <div className="bg-[#060d17] border border-slate-800/80 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                        <Headphones className="w-3.5 h-3.5 text-blue-400" />
                        <span>Track for the week</span>
                      </div>
                      <p className="text-slate-200">
                        {devotion?.weekly_track || "Not set"}
                      </p>
                    </div>

                    <div className="bg-[#060d17] border border-slate-800/80 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>Book of the month page number</span>
                      </div>
                      <p className="text-slate-200">
                        {devotion?.book_page || "Not set"}
                      </p>
                    </div>
                  </div>

                  {/* AI Exhortation Callout */}
                  {devotion?.ai_feedback && (
                    <div className="bg-[#060d17] border-l-2 border-amber-500 p-3.5 rounded-r-lg">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] uppercase tracking-widest mb-1.5">
                        <Lightbulb className="w-3.5 h-3.5" /> AI Spiritual Exhortation
                      </div>
                      <p className="text-xs text-slate-300 italic leading-relaxed">
                        {devotion?.ai_feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#0b1626] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between text-slate-400 mb-3">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">{title}</span>
        {icon}
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</div>
    </div>
  );
}
