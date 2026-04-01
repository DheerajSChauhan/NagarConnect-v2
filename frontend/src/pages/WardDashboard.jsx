import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import PriorityBadge from "../components/PriorityBadge";
import { complaintMarkers } from "../data/mockData";
import { useAuth } from "../context/AuthContext";

const OfficerDashboard = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState(complaintMarkers);
  const [resolutionFiles, setResolutionFiles] = useState({});
  const role = user?.role || "city_officer";

  const filtered = useMemo(() => {
    if (role === "city_officer") {
      return rows.filter((item) => item.city === user?.city);
    }
    if (role === "district_officer") {
      return rows.filter((item) => item.district === user?.district);
    }
    if (role === "state_officer") {
      return rows.filter((item) => item.state === user?.state);
    }
    return rows;
  }, [role, rows, user?.city, user?.district, user?.state]);

  const update = (id, patch) => setRows((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  return (
    <div className="min-h-screen bg-app dark:bg-[#0D1117]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-heading text-3xl font-bold">
          Officer Dashboard - {[user?.city, user?.district, user?.state].filter(Boolean).join(", ") || "All India"}
        </h1>

        <div className="mt-6 space-y-4">
          {filtered.map((row) => (
            <article key={row.id} className="rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">{row.id}</p>
                  <h2 className="text-lg font-semibold">{row.title}</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{row.category}</span>
                    <PriorityBadge priority={row.priority} />
                  </div>
                </div>
                <select
                  value={row.status}
                  onChange={(event) => update(row.id, { status: event.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                >
                  {["Pending", "Assigned", "In Progress", "Resolved"].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500">Citizen Photo</p>
                  <img src={row.image} alt="citizen" className="mt-2 h-28 w-full rounded-lg object-cover" />
                </div>
                <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500">Resolution Photo</p>
                  {resolutionFiles[row.id] ? (
                    <img src={URL.createObjectURL(resolutionFiles[row.id])} alt="resolution" className="mt-2 h-28 w-full rounded-lg object-cover" />
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">Not uploaded yet</p>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="mt-3 w-full text-xs"
                    onChange={(event) =>
                      setResolutionFiles((prev) => ({
                        ...prev,
                        [row.id]: event.target.files?.[0],
                      }))
                    }
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <textarea
                  placeholder="Add internal notes"
                  className="h-24 rounded-xl border border-slate-300 p-3"
                  onChange={(event) => update(row.id, { note: event.target.value })}
                />
                <input
                  placeholder="Assign to field team"
                  className="rounded-xl border border-slate-300 p-3"
                  onChange={(event) => update(row.id, { team: event.target.value })}
                />
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};

export default OfficerDashboard;
