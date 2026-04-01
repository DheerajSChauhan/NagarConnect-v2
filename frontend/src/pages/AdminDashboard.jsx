import { useMemo, useState } from "react";
import { FaChartPie, FaMapMarkedAlt, FaTable } from "react-icons/fa";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import PriorityBadge from "../components/PriorityBadge";
import { complaintMarkers } from "../data/mockData";

const priorityWeight = (priority) => {
  if (priority === "urgent") return 0;
  if (priority === "medium") return 1;
  return 2;
};

const getOfficerLabel = (row) => {
  if (row.assignedOfficer) return row.assignedOfficer;

  if (typeof row.ward === "string" && row.ward.trim()) {
    return `Officer-${row.ward.replace("Ward ", "").trim()}`;
  }

  const scope = row.city || row.district || row.state || row.locality;
  return scope ? `Officer-${scope}` : "Not Assigned";
};

const AdminDashboard = () => {
  const [tab, setTab] = useState("queue");
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState(complaintMarkers);

  const urgent = useMemo(() => rows.filter((item) => item.priority === "urgent").length, [rows]);

  const updateStatus = (id, status) => {
    setRows((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0D1117]">
      <Navbar />
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl bg-slate-900 p-4 text-slate-100">
          <h2 className="font-heading text-xl font-bold">Admin Panel</h2>
          <div className="mt-4 space-y-2">
            {[
              { key: "queue", label: "Priority Queue", icon: <FaTable /> },
              { key: "map", label: "Map View", icon: <FaMapMarkedAlt /> },
              { key: "analytics", label: "Analytics", icon: <FaChartPie /> },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left ${tab === item.key ? "bg-emerald-700" : "bg-slate-800"}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: "Total Complaints", value: rows.length },
              { label: "Urgent Count", value: urgent },
              { label: "Pending", value: rows.filter((item) => item.status !== "Resolved").length },
              { label: "Resolved Today", value: rows.filter((item) => item.status === "Resolved").length },
            ].map((card) => (
              <article key={card.label} className="rounded-2xl bg-white p-4 shadow-card dark:bg-slate-900">
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="font-heading text-3xl font-bold">{card.value}</p>
              </article>
            ))}
          </div>

          {tab === "queue" ? (
            <div className="overflow-x-auto rounded-2xl bg-white shadow-card dark:bg-slate-900">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Complaint</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Officer</th>
                    <th className="px-4 py-3">Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows].sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority)).map((row) => (
                    <tr key={row.id} className={`${row.priority === "urgent" ? "bg-red-50 dark:bg-red-950/20" : ""} border-t border-slate-100 dark:border-slate-800`}>
                      <td className="px-4 py-3">
                        <button type="button" className="text-left" onClick={() => setSelected(row)}>
                          <p className="font-semibold">{row.id}</p>
                          <p>{row.title}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={row.priority} /></td>
                      <td className="px-4 py-3">{row.locationName}</td>
                      <td className="px-4 py-3">
                        <select value={row.status} onChange={(event) => updateStatus(row.id, event.target.value)} className="rounded-lg border border-slate-300 px-2 py-1">
                          {[
                            "Pending",
                            "Assigned",
                            "In Progress",
                            "Resolved",
                          ].map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">{getOfficerLabel(row)}</td>
                      <td className="px-4 py-3"><img src={row.image} alt={row.title} className="h-12 w-16 rounded-lg object-cover" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === "map" ? <MapView complaints={rows} heightClass="h-[65vh]" /> : null}

          {tab === "analytics" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
                <h3 className="font-semibold">Complaints Over Time</h3>
                <div className="mt-3 h-48 rounded-xl bg-gradient-to-r from-emerald-200 to-civic-blue/40" />
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
                <h3 className="font-semibold">Category Distribution</h3>
                <div className="mt-3 h-48 rounded-xl bg-gradient-to-r from-orange-200 to-red-200" />
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {selected ? (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <button type="button" onClick={() => setSelected(null)} className="mb-3 rounded-lg bg-slate-100 px-3 py-1 text-sm dark:bg-slate-800">Close</button>
          <h3 className="font-heading text-xl font-bold">{selected.id}</h3>
          <p className="mt-2 text-sm text-slate-500">{selected.title}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">Before Photo</p>
              <img src={selected.image} alt="before" className="mt-1 h-28 w-full rounded-xl object-cover" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">After Photo</p>
              <img src={selected.image} alt="after" className="mt-1 h-28 w-full rounded-xl object-cover" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
