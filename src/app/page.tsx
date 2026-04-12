"use client";

import { useEffect, useState } from "react";
import { supabase, WaterLog } from "@/lib/supabase";

const DAILY_GOAL = 8;

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function GlassProgress({ glasses }: { glasses: number }) {
  const total = DAILY_GOAL;
  const filled = Math.min(glasses, total);

  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-8 h-10 rounded-b-xl rounded-t-sm border-2 transition-all duration-300 ${
            i < filled
              ? "bg-blue-400 border-blue-500 shadow-sm shadow-blue-200"
              : "bg-blue-50 border-blue-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const today = getTodayStr();
  const [glasses, setGlasses] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>("0");
  const [history, setHistory] = useState<WaterLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("water_logs")
        .select("date, glasses")
        .order("date", { ascending: false })
        .limit(30);

      if (data) {
        const todayLog = data.find((r) => r.date === today);
        if (todayLog) {
          setGlasses(todayLog.glasses);
          setInputVal(String(todayLog.glasses));
        }
        setHistory(data.filter((r) => r.date !== today));
      }
      setLoading(false);
    }
    load();
  }, [today]);

  async function handleSave() {
    const val = Math.max(0, Math.min(99, parseInt(inputVal) || 0));
    setSaving(true);
    const { error } = await supabase
      .from("water_logs")
      .upsert({ date: today, glasses: val }, { onConflict: "date" });

    if (!error) {
      setGlasses(val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  const pct = Math.min(100, Math.round((glasses / DAILY_GOAL) * 100));

  return (
    <main className="min-h-screen px-4 py-12 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500 shadow-lg shadow-blue-200 mb-4">
          <svg
            className="w-7 h-7 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
          Water Tracker
        </h1>
        <p className="text-slate-400 text-sm mt-1">{formatDate(today)}</p>
      </div>

      {/* Today card */}
      <div className="bg-white rounded-3xl shadow-sm border border-blue-100 p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-0.5">
              Today
            </p>
            <p className="text-4xl font-bold text-slate-800">
              {loading ? "—" : glasses}
              <span className="text-lg font-normal text-slate-400 ml-1">
                / {DAILY_GOAL} glasses
              </span>
            </p>
          </div>
          <div className="text-right">
            <span
              className={`text-2xl font-bold ${
                pct >= 100 ? "text-emerald-500" : "text-blue-500"
              }`}
            >
              {loading ? "—" : `${pct}%`}
            </span>
            <p className="text-xs text-slate-400 mt-0.5">of goal</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-blue-50 rounded-full overflow-hidden mb-5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pct >= 100 ? "bg-emerald-400" : "bg-blue-400"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Glass icons */}
        {!loading && <GlassProgress glasses={glasses} />}
      </div>

      {/* Input card */}
      <div className="bg-white rounded-3xl shadow-sm border border-blue-100 p-6 mb-8">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">
          Log glasses
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="number"
              min={0}
              max={99}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full px-4 py-3 rounded-2xl border-2 border-blue-100 bg-blue-50/50 text-slate-800 text-lg font-semibold focus:outline-none focus:border-blue-400 transition-colors"
              placeholder="0"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              saved
                ? "bg-emerald-500 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-200"
            } disabled:opacity-60`}
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
          </button>
        </div>

        {/* Quick-add buttons */}
        <div className="flex gap-2 mt-3">
          {[1, 2, 4, 6, 8].map((n) => (
            <button
              key={n}
              onClick={() => setInputVal(String(n))}
              className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3 px-1">
            Past days
          </p>
          <div className="flex flex-col gap-2">
            {history.map((log) => {
              const logPct = Math.min(
                100,
                Math.round((log.glasses / DAILY_GOAL) * 100)
              );
              return (
                <div
                  key={log.date}
                  className="bg-white rounded-2xl border border-blue-100 px-5 py-4 flex items-center justify-between shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {formatDate(log.date)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {log.glasses} glass{log.glasses !== 1 ? "es" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          logPct >= 100 ? "bg-emerald-400" : "bg-blue-300"
                        }`}
                        style={{ width: `${logPct}%` }}
                      />
                    </div>
                    <span
                      className={`text-sm font-semibold w-10 text-right ${
                        logPct >= 100 ? "text-emerald-500" : "text-slate-500"
                      }`}
                    >
                      {logPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && history.length === 0 && (
        <p className="text-center text-slate-300 text-sm mt-4">
          No history yet. Start logging!
        </p>
      )}
    </main>
  );
}
