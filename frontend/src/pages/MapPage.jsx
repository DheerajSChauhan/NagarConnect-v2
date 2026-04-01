import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import { API_BASE_URL } from "../config/api";
import { complaintMarkers } from "../data/mockData";
import { useLanguage } from "../context/LanguageContext";

const hashToOffset = (text) => {
  let hash = 0;
  const input = String(text || "nagar");
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 1000) / 1000;
  return (normalized - 0.5) * 0.18;
};

const parseCoordinates = (locationText, fallbackSeed) => {
  const text = String(locationText || "");
  const match = text.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
  if (match) {
    return [Number(match[1]), Number(match[2])];
  }
  return [23.2599 + hashToOffset(`${fallbackSeed}-lat`), 77.4126 + hashToOffset(`${fallbackSeed}-lng`)];
};

const normalizePriority = (value) => {
  const v = String(value || "").toLowerCase();
  if (["urgent", "high", "critical"].includes(v)) return "urgent";
  if (["medium", "moderate"].includes(v)) return "medium";
  return "low";
};

const normalizeCategory = (value) => {
  const v = String(value || "Other").toLowerCase();
  if (v.includes("water") || v.includes("drain")) return "Water";
  if (v.includes("road") || v.includes("pothole")) return "Road";
  if (v.includes("garbage") || v.includes("sanitation") || v.includes("waste")) return "Sanitation";
  if (v.includes("construction")) return "Construction";
  if (v.includes("light") || v.includes("electric")) return "Lighting";
  return "Other";
};

const normalizeComplaint = (item, index = 0) => {
  const id = item.id || item._id || `tmp-${Date.now()}-${index}`;
  const rawLocation = item.locationName || item.location || "Bhopal";
  return {
    id,
    title: item.title || "Untitled complaint",
    category: normalizeCategory(item.category),
    priority: normalizePriority(item.priority),
    status: item.status || "Pending",
    date: item.date || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"),
    state: item.state || item.user?.state || "",
    district: item.district || item.user?.district || "",
    city: item.city || item.user?.city || "",
    locality: item.locality || "",
    locationName: rawLocation,
    location: rawLocation,
    coordinates: Array.isArray(item.coordinates)
      ? item.coordinates
      : item.latitude !== undefined && item.longitude !== undefined
        ? [Number(item.latitude), Number(item.longitude)]
        : parseCoordinates(rawLocation, id),
    image: item.image || null,
    upvotes: Number(item.upvotes || 0),
  };
};

const buildLocationFilterOptions = (complaints) => {
  const stateMap = new Map();
  const districtMap = new Map();
  const cityMap = new Map();

  for (const item of complaints) {
    if (item.state) {
      stateMap.set(item.state, {
        value: `state|${item.state}`,
        label: `State: ${item.state}`,
      });
    }

    if (item.state && item.district) {
      const key = `${item.state}__${item.district}`;
      districtMap.set(key, {
        value: `district|${item.state}|${item.district}`,
        label: `District: ${item.district}, ${item.state}`,
      });
    }

    if (item.state && item.district && item.city) {
      const key = `${item.state}__${item.district}__${item.city}`;
      cityMap.set(key, {
        value: `city|${item.state}|${item.district}|${item.city}`,
        label: `City: ${item.city}, ${item.state}`,
      });
    }
  }

  return [
    { value: "all", label: "All India" },
    ...[...stateMap.values()].sort((a, b) => a.label.localeCompare(b.label)),
    ...[...districtMap.values()].sort((a, b) => a.label.localeCompare(b.label)),
    ...[...cityMap.values()].sort((a, b) => a.label.localeCompare(b.label)),
  ];
};

const matchesLocationFilter = (item, locationFilter) => {
  if (!locationFilter || locationFilter === "all") return true;

  const parts = locationFilter.split("|");
  const type = parts[0];

  if (type === "state") {
    return item.state === parts[1];
  }
  if (type === "district") {
    return item.state === parts[1] && item.district === parts[2];
  }
  if (type === "city") {
    return item.state === parts[1] && item.district === parts[2] && item.city === parts[3];
  }

  return true;
};

const MapPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [category, setCategory] = useState("All");
  const [priority, setPriority] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [locationQuery, setLocationQuery] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [heatmap, setHeatmap] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [userUpvotes, setUserUpvotes] = useState({});
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const { tr } = useLanguage();

  const locationFilterOptions = useMemo(() => buildLocationFilterOptions(complaints), [complaints]);

  const filteredLocationOptions = useMemo(() => {
    const query = locationQuery.trim().toLowerCase();
    if (!query) return locationFilterOptions;

    const next = locationFilterOptions.filter((item) => item.value === "all" || item.label.toLowerCase().includes(query));

    if (!next.some((item) => item.value === locationFilter)) {
      const selected = locationFilterOptions.find((item) => item.value === locationFilter);
      if (selected) next.push(selected);
    }

    return next;
  }, [locationFilter, locationFilterOptions, locationQuery]);

  useEffect(() => {
    const loadPublicComplaints = async () => {
      const localComplaints = JSON.parse(localStorage.getItem("localComplaints") || "[]");
      const localNormalized = localComplaints.map((item, index) => normalizeComplaint(item, index));

      try {
        const response = await fetch(`${API_BASE_URL}/api/complaints/public`);
        if (!response.ok) {
          throw new Error("Public complaints fetch failed");
        }

        const data = await response.json();
        const serverNormalized = (data.complaints || []).map((item, index) => normalizeComplaint(item, index));
        const merged = [...localNormalized, ...serverNormalized, ...complaintMarkers.map((item, index) => normalizeComplaint(item, index))];
        const deduped = Object.values(merged.reduce((acc, item) => ({ ...acc, [item.id]: item }), {}));
        setComplaints(deduped);
      } catch {
        const merged = [...localNormalized, ...complaintMarkers.map((item, index) => normalizeComplaint(item, index))];
        const deduped = Object.values(merged.reduce((acc, item) => ({ ...acc, [item.id]: item }), {}));
        setComplaints(deduped);
      }
    };

    loadPublicComplaints();

    const refreshFromEvent = () => loadPublicComplaints();
    window.addEventListener("storage", refreshFromEvent);
    window.addEventListener("complaints:updated", refreshFromEvent);

    const interval = setInterval(loadPublicComplaints, 15000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", refreshFromEvent);
      window.removeEventListener("complaints:updated", refreshFromEvent);
    };
  }, []);

  const list = useMemo(
    () =>
      complaints.filter((item) => {
        const categoryMatch = category === "All" || item.category === category;
        const priorityMatch = priority === "all" || item.priority === priority;
        const locationMatch = matchesLocationFilter(item, locationFilter);
        return categoryMatch && priorityMatch && locationMatch;
      }),
    [category, complaints, locationFilter, priority]
  );

  const upvote = (id) => {
    const hasUpvoted = Boolean(userUpvotes[id]);

    setComplaints((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextCount = hasUpvoted ? item.upvotes - 1 : item.upvotes + 1;
        return { ...item, upvotes: Math.max(0, nextCount) };
      })
    );

    setUserUpvotes((prev) => ({
      ...prev,
      [id]: !hasUpvoted,
    }));
  };

  const resolveImageUrl = (value) => {
    if (!value) return null;
    if (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:") ||
      value.startsWith("blob:")
    ) {
      return value;
    }
    // Keep frontend static assets on frontend origin; only backend upload paths need API base prefix.
    if (value.startsWith("/assets/") || value.startsWith("/src/") || value.startsWith("/@fs/")) {
      return value;
    }
    if (value.startsWith("/uploads/")) {
      return `${API_BASE_URL}${value}`;
    }
    if (value.startsWith("uploads/") || value.startsWith("complaints/") || value.startsWith("id-proofs/")) {
      return `${API_BASE_URL}/${value}`;
    }
    if (value.startsWith("/")) {
      return value;
    }
    return `${API_BASE_URL}/${value}`;
  };

  return (
    <div className="h-screen overflow-hidden bg-app dark:bg-[#0D1117]">
      <Navbar />
      <div className="flex h-[calc(100vh-64px)] gap-3 px-3 pb-3">
        <aside className={`${collapsed ? "w-14" : "w-[340px]"} rounded-2xl bg-white p-3 shadow-card transition dark:bg-slate-900`}>
          <button type="button" onClick={() => setCollapsed((prev) => !prev)} className="mb-3 rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
            {collapsed ? "Open" : "Collapse"}
          </button>

          {collapsed ? null : (
            <>
              <h2 className="font-heading text-xl font-bold">{tr("map.nearbyComplaints", "Nearby Complaints")}</h2>

              <div className="mt-3 grid gap-3">
                <div className="flex flex-wrap gap-2">
                  {["All", "Road", "Water", "Sanitation", "Construction", "Lighting", "Other"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={`rounded-[20px] border px-4 py-1.5 text-xs font-semibold ${
                        category === item
                          ? "border-[#1A6B3C] bg-[#1A6B3C] text-white"
                          : "border-[#E0D5C5] bg-white text-[#5e4a37]"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All Priority" },
                    { value: "urgent", label: "Urgent" },
                    { value: "medium", label: "Medium" },
                    { value: "low", label: "Low" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setPriority(item.value)}
                      className={`rounded-[20px] border px-4 py-1.5 text-xs font-semibold ${
                        priority === item.value
                          ? "border-[#1A6B3C] bg-[#1A6B3C] text-white"
                          : "border-[#E0D5C5] bg-white text-[#5e4a37]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdvancedOpen((prev) => !prev)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    {advancedOpen ? "Hide Filters" : "Filter Options"}
                  </button>
                  {(priority !== "all" || category !== "All" || locationFilter !== "all") ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCategory("All");
                        setPriority("all");
                        setLocationFilter("all");
                        setLocationQuery("");
                      }}
                      className="rounded-lg px-3 py-2 text-xs font-semibold text-[#1A237E] underline"
                    >
                      Clear all filters
                    </button>
                  ) : null}
                </div>

                {advancedOpen ? (
                  <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <label className="text-xs font-semibold text-slate-600">Location Filter</label>
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={(event) => setLocationQuery(event.target.value)}
                      placeholder="Search state, district, city"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                    <select
                      value={locationFilter}
                      onChange={(event) => setLocationFilter(event.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                    >
                      {filteredLocationOptions.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setHeatmap((prev) => !prev)} className="rounded-lg bg-civic-blue px-3 py-2 text-sm font-semibold text-white">
                      {heatmap ? tr("map.hideHeatmap", "Hide Heatmap") : tr("map.showHeatmap", "Show Heatmap")}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 h-[62vh] space-y-2 overflow-y-auto pr-1">
                {list.map((item) => (
                  <article
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedComplaintId(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedComplaintId(item.id);
                      }
                    }}
                    className={`cursor-pointer rounded-xl border p-3 text-sm transition ${
                      selectedComplaintId === item.id
                        ? "border-[#1A6B3C] bg-[#f3fbf5]"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    } dark:border-slate-700 dark:bg-slate-900`}
                  >
                    {resolveImageUrl(item.image) ? (
                      <img
                        src={resolveImageUrl(item.image)}
                        alt={item.title}
                        className="mb-2 h-24 w-full rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="mb-2 grid h-24 w-full place-items-center rounded-lg bg-[linear-gradient(135deg,#1A6B3C,#1A237E)] text-3xl">
                        📍
                      </div>
                    )}
                    <h3 className="line-clamp-2 break-words font-semibold leading-5">{item.title}</h3>
                    <p className="mt-1 line-clamp-1 break-words text-xs text-slate-500">{item.locationName || item.location}</p>
                    <p className="mt-1 text-xs">{tr("map.upvotes", "Upvotes")}: {item.upvotes}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </aside>

        <main className="flex-1">
          <MapView
            selectedCategory={category}
            selectedPriority={priority}
            complaints={list}
            focusMarkerId={selectedComplaintId}
            showHeatmap={heatmap}
            heightClass="h-full"
            onUpvote={upvote}
            isUpvoted={(id) => Boolean(userUpvotes[id])}
          />
        </main>
      </div>
    </div>
  );
};

export default MapPage;
