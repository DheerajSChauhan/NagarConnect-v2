import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const tabs = ["States", "Cities", "Fastest Resolved", "Most Active"];

const Leaderboard = () => {
  const [tab, setTab] = useState("States");

  const rows = useMemo(() => {
    const base = [
      { name: "Madhya Pradesh", type: "state", complaints: 1820, resolvedRate: 81, avgDays: 4.2, trend: "up" },
      { name: "Maharashtra", type: "state", complaints: 3620, resolvedRate: 79, avgDays: 4.8, trend: "up" },
      { name: "Tamil Nadu", type: "state", complaints: 2140, resolvedRate: 77, avgDays: 5.1, trend: "flat" },
      { name: "Bhopal", type: "city", complaints: 880, resolvedRate: 84, avgDays: 3.4, trend: "up" },
      { name: "Indore", type: "city", complaints: 910, resolvedRate: 86, avgDays: 3.2, trend: "up" },
      { name: "Pune", type: "city", complaints: 1090, resolvedRate: 80, avgDays: 3.7, trend: "flat" },
      { name: "Surat", type: "city", complaints: 760, resolvedRate: 82, avgDays: 3.1, trend: "up" },
      { name: "Jaipur", type: "city", complaints: 640, resolvedRate: 74, avgDays: 5.8, trend: "down" },
      { name: "Kolkata", type: "city", complaints: 1030, resolvedRate: 72, avgDays: 6.2, trend: "down" },
    ];

    if (tab === "States") {
      return base.filter((item) => item.type === "state").sort((a, b) => b.resolvedRate - a.resolvedRate);
    }
    if (tab === "Cities") {
      return base.filter((item) => item.type === "city").sort((a, b) => b.resolvedRate - a.resolvedRate);
    }
    if (tab === "Fastest Resolved") {
      return base.filter((item) => item.type === "city").sort((a, b) => a.avgDays - b.avgDays).slice(0, 10);
    }
    return base.filter((item) => item.type === "city").sort((a, b) => b.complaints - a.complaints).slice(0, 10);
  }, [tab]);

  return (
    <div className="min-h-screen bg-app dark:bg-[#0D1117]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-heading text-3xl font-bold">National Leaderboard</h1>
        <p className="mt-2 text-slate-500">Track resolution performance across states and cities.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === item ? "bg-[#1A6B3C] text-white" : "bg-white text-[#1C1008]"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {rows.map((item, index) => (
            <article key={`${tab}-${item.name}`} className="rounded-2xl bg-white p-4 shadow-card dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Rank #{index + 1}</p>
                  <h2 className="font-semibold">{item.name}</h2>
                  <p className="text-xs text-slate-500">Total complaints: {item.complaints}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-2xl font-bold text-emerald-700">{item.resolvedRate}%</p>
                  <p className="text-xs text-slate-500">Avg {item.avgDays} days • Trend {item.trend === "up" ? "↑" : item.trend === "down" ? "↓" : "→"}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Leaderboard;
