import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { Flame, Clock, BookOpen, ShieldAlert, Users, LayoutDashboard, Lightbulb } from "lucide-react";
import React from "react";

export const dynamic = "force-dynamic";

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
            Please use Telegram to request a secure magic link by sending the <code className="text-amber-400 font-mono">/dashboard</code> command to the bot.
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

  // Fetch live role directly from DB
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  const role = userData?.role || "member";

  let logs: any[] = [];
  let userCount = 0;

  if (role === "admin") {
    const { data } = await supabase
      .from("spiritual_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    logs = data || [];
    
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });
    userCount = count || 0;
  } else {
    const { data } = await supabase
      .from("spiritual_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    logs = data || [];
  }

  const totalPrayerMinutes = logs.reduce((acc, curr) => acc + (Number(curr.duration_minutes) || 0), 0);
  const totalPrayerHours = (totalPrayerMinutes / 60).toFixed(1);

  // Calculate Member Streak
  let streak = 0;
  if (role === "member") {
    const uniqueDates = Array.from(new Set(logs.map((l) => l.created_at?.split("T")[0]).filter(Boolean)));
    let checkDate = new Date();
    
    for (const dStr of uniqueDates) {
      if (!dStr) continue;
      const entryDate = new Date(dStr);
      const diffDays = Math.floor((checkDate.getTime() - entryDate.getTime()) / (1000 * 3600 * 24));
      
      // Allow a 1-day gap (yesterday and today)
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
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#0F3D70]/20 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                {role === "admin" ? "Global Operations" : "The Altar Ledger"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {role === "admin" ? "Admin Oversight" : "Spiritual Growth Tracker"}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#0b1626] px-3 py-1.5 rounded-lg border border-slate-800 shadow-sm">
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>Role: <span className="text-white font-medium capitalize">{role}</span></span>
          </div>
        </header>

        {/* Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-8">
          {role === "admin" ? (
            <>
              <MetricCard title="Network Users" value={userCount} icon={<Users className="w-4 h-4 text-blue-400" />} />
              <MetricCard title="Global Prayer Hours" value={totalPrayerHours} icon={<Clock className="w-4 h-4 text-emerald-400" />} />
              <MetricCard title="Logs Captured" value={logs.length} icon={<BookOpen className="w-4 h-4 text-amber-400" />} />
            </>
          ) : (
            <>
              <MetricCard title="Active Streak" value={`${streak} Days`} icon={<Flame className="w-4 h-4 text-amber-400" />} />
              <MetricCard title="Total Prayer Time" value={`${totalPrayerHours} hrs`} icon={<Clock className="w-4 h-4 text-emerald-400" />} />
              <MetricCard title="Devotions Logged" value={logs.length} icon={<BookOpen className="w-4 h-4 text-blue-400" />} />
            </>
          )}
        </div>

        {/* Feed Section */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">
            {role === "admin" ? "Recent Network Activity (Anonymized)" : "Your Telemetry Feed"}
          </h2>
          
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-[#0b1626] border border-dashed border-slate-800 rounded-xl text-sm">
              No entries found. Send a devotion log to the bot to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="bg-[#0b1626] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition duration-200">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-200">
                        {log.created_at ? new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Unknown Date"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#0F3D70]/20 text-blue-300 font-bold text-[10px] border border-blue-500/20 uppercase tracking-widest">
                        {log.category}
                      </span>
                    </div>
                    {role === "admin" && (
                      <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                        UID: {log.user_id?.toString().slice(-4)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
                    {log.content}
                  </p>
                  
                  {log.ai_feedback && (
                    <div className="bg-[#060d17] border-l-2 border-amber-500 p-3.5 rounded-r-lg">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] uppercase tracking-widest mb-1.5">
                        <Lightbulb className="w-3.5 h-3.5" /> AI Synthesis
                      </div>
                      <p className="text-xs text-slate-300 italic leading-relaxed">
                        {log.ai_feedback}
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

function MetricCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-[#0b1626] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between text-slate-400 mb-3 sm:mb-4">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">{title}</span>
        {icon}
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</div>
    </div>
  );
}
