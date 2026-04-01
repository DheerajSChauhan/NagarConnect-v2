import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { CheckCircle, Cpu, FileText } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ChatbotWidget from "../components/ChatbotWidget";
import MapView from "../components/MapView";
import PriorityBadge from "../components/PriorityBadge";
import ComplaintCard from "../components/ComplaintCard";
import { complaintMarkers, priorities } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const MotionSection = motion.section;
const MotionDiv = motion.div;

const sectionVariant = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

const parseMetricValue = (metric) => {
  const numeric = Number(metric.value.toString().replace(/[^0-9.]/g, ""));
  const decimals = metric.value.includes(".") ? 1 : 0;
  const suffix = metric.value.toString().replace(/[0-9.,]/g, "");
  return {
    target: Number.isNaN(numeric) ? 0 : numeric,
    decimals,
    suffix,
  };
};

const StatCard = ({ metric, active }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;

    const { target } = parseMetricValue(metric);
    let frame;
    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(target * progress);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, metric]);

  const { decimals, suffix } = parseMetricValue(metric);
  const shown = active ? count : 0;

  return (
    <div className="rounded-2xl border border-[#d79a63]/45 bg-[#f5b172]/20 p-4 text-center text-white">
      <p className="text-xl" aria-hidden="true">{metric.icon}</p>
      <p className="mt-1 font-heading text-[32px] font-extrabold leading-tight md:text-[36px]">
        {shown.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
        {suffix}
      </p>
      <p className="font-body text-sm text-[#ffe7ca]">{metric.label}</p>
    </div>
  );
};

StatCard.propTypes = {
  metric: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  active: PropTypes.bool.isRequired,
};

const Home = () => {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [complaints, setComplaints] = useState(complaintMarkers);
  const [userUpvotes, setUserUpvotes] = useState({});
  const { isAuthenticated, openAuthModal } = useAuth();
  const { t } = useLanguage();

  const statsRef = useRef(null);
  const [activateCounters, setActivateCounters] = useState(false);

  const metrics = [
    { icon: "📋", value: "47,293", label: "Complaints Filed" },
    { icon: "✅", value: "31,847", label: "Resolved" },
    { icon: "⏱️", value: "8.3", label: "Avg Days" },
    { icon: "🏙️", value: "23", label: "Cities Connected" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActivateCounters(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) observer.observe(statsRef.current);

    return () => observer.disconnect();
  }, []);

  const categories = ["All", "Road", "Water", "Sanitation", "Construction", "Other"];

  const filteredMapData = useMemo(
    () =>
      complaints.filter((item) => {
        const categoryMatch = categoryFilter === "All" || item.category === categoryFilter;
        const priorityMatch = priorityFilter === "all" || item.priority === priorityFilter;
        return categoryMatch && priorityMatch;
      }),
    [categoryFilter, complaints, priorityFilter]
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

  return (
    <div className="bg-app text-[#1C1008]">
      <Navbar />

      <section className="relative overflow-hidden hero-shell">
        <div className="absolute inset-0 hero-dot-overlay" />
        <svg
          viewBox="0 0 640 240"
          className="pointer-events-none absolute bottom-0 right-0 hidden w-[55%] max-w-[680px] opacity-20 lg:block"
          aria-hidden="true"
        >
          <g fill="#ffffff">
            <rect x="20" y="140" width="42" height="86" rx="2" />
            <rect x="70" y="122" width="52" height="104" rx="2" />
            <rect x="130" y="102" width="58" height="124" rx="2" />
            <rect x="197" y="152" width="34" height="74" rx="2" />
            <path d="M250 226V120h55l28 28v78z" />
            <path d="M355 226v-82l25-35 25 35v82z" />
            <rect x="420" y="132" width="44" height="94" rx="2" />
            <path d="M480 226v-96h65v96z" />
            <circle cx="512" cy="120" r="8" />
            <rect x="566" y="156" width="32" height="70" rx="2" />
            <path d="M350 180c16-16 30-16 46 0" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
          </g>
        </svg>

        <div className="section-shell relative flex min-h-[78vh] flex-col items-center justify-center text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="font-heading text-4xl font-extrabold leading-tight md:text-6xl"
          >
            Har Nagrik Ki Awaaz, Ab Seedha Nagarpalika Tak
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="mt-5 max-w-2xl font-body text-lg text-[#f3eadf] md:text-xl"
          >
            Report civic issues in Hindi or English, get smart priority routing, and track every step to samadhan.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <button
              type="button"
              onClick={() => (isAuthenticated ? null : openAuthModal("login"))}
              className="rounded-lg bg-[#FF8C00] px-7 py-3 font-accent text-base font-semibold text-white hover:bg-[#e97e00]"
            >
              {t.fileComplaint}
            </button>
            <Link
              to="/map"
              className="rounded-lg border border-white/80 px-7 py-3 font-accent text-base font-semibold text-white hover:bg-white/10"
            >
              Apna Sheher Dekho
            </Link>
          </motion.div>
        </div>
      </section>

      <section ref={statsRef} className="bg-[linear-gradient(90deg,#cc7a31,#b96f2d,#8d5b34)] py-8">
        <div className="section-shell grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <StatCard key={metric.label} metric={metric} active={activateCounters} />
          ))}
        </div>
      </section>

      <MotionSection className="section-shell section-pad" variants={sectionVariant} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <h2 className="section-title">How It Works</h2>
        <p className="mt-2 font-body text-[#7A6652]">Simple complaint flow for real city-level action.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: <FileText size={32} />, title: "Step 1: File Complaint", text: "Submit a shikayat with location details in Hindi or English.",
            },
            {
              icon: <Cpu size={32} />, title: "Step 2: AI Prioritizes", text: "The platform scores urgency and routes it to the right team.",
            },
            {
              icon: <CheckCircle size={32} />, title: "Step 3: Track Resolution", text: "Follow updates until complaint is verified and resolved.",
            },
          ].map((item) => (
            <div key={item.title} className="kolam-border rounded-2xl bg-card p-6 shadow-card">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#1A6B3C15] text-[#1A6B3C]">
                {item.icon}
              </div>
              <h3 className="mt-4 font-heading text-2xl font-bold">{item.title}</h3>
              <p className="mt-2 font-body text-sm text-[#7A6652]">{item.text}</p>
            </div>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="section-shell section-pad" variants={sectionVariant} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <h2 className="section-title">Priority Showcase</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Waterlogging blocking ambulance near school chowk",
              priority: "urgent",
              location: "Subhash Nagar, Bhopal",
              score: "94/100",
              icon: "🚨",
              gradient: "linear-gradient(135deg,#B71C1C,#C62828)",
            },
            {
              title: "Illegal construction encroaching public footpath",
              priority: "medium",
              location: "Hamidia Road, Bhopal",
              score: "61/100",
              icon: "⚠️",
              gradient: "linear-gradient(135deg,#E65100,#FF6D00)",
            },
            {
              title: "Road pothole and drainage cut causing traffic risk",
              priority: "low",
              location: "Arera Colony E-4, Bhopal",
              score: "28/100",
              icon: "✅",
              gradient: "linear-gradient(135deg,#2E7D32,#388E3C)",
            },
          ].map((item) => (
            <div key={item.title} className="kolam-border overflow-hidden rounded-2xl bg-card shadow-card">
              <div className="grid h-40 place-items-center text-center" style={{ background: item.gradient }}>
                <p className="text-5xl">{item.icon}</p>
              </div>
              <div className="p-6">
                <PriorityBadge priority={item.priority} />
                <h3 className="mt-3 font-body text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-[#7A6652]">{item.location}</p>
                <p className="mt-1 text-sm text-[#7A6652]">Score: {item.score}</p>
              </div>
            </div>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="section-pad bg-card" variants={sectionVariant} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="section-shell">
          <h2 className="section-title text-center">Apna Sheher Dekho</h2>
          <p className="mt-2 text-center font-body text-[#7A6652]">Live map with category and priority filters.</p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={`rounded-[20px] border px-4 py-1.5 text-sm font-semibold ${
                  categoryFilter === category
                    ? "border-[#1A6B3C] bg-[#1A6B3C] text-white"
                    : "border-[#E0D5C5] bg-white text-[#5e4a37]"
                }`}
              >
                {category}
              </button>
            ))}

            {Object.keys(priorities).map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => setPriorityFilter(priority)}
                className={`rounded-[20px] border px-4 py-1.5 text-sm font-semibold ${
                  priorityFilter === priority
                    ? "border-[#1A6B3C] bg-[#1A6B3C] text-white"
                    : "border-[#E0D5C5] bg-white text-[#5e4a37]"
                }`}
              >
                {priorities[priority].label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPriorityFilter("all")}
              className="rounded-[20px] border border-[#E0D5C5] bg-white px-4 py-1.5 text-sm font-semibold text-[#5e4a37]"
            >
              Clear
            </button>
          </div>

          <div className="mt-6">
            <MapView
              selectedCategory={categoryFilter}
              selectedPriority={priorityFilter}
              complaints={filteredMapData}
              onUpvote={upvote}
              isUpvoted={(id) => Boolean(userUpvotes[id])}
            />
          </div>
        </div>
      </MotionSection>

      <MotionSection className="section-shell section-pad" variants={sectionVariant} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="section-title">Recent Shikayat Feed</h2>
          <Link to="/map" className="rounded-lg bg-[#1A6B3C] px-4 py-2 text-sm font-semibold text-white">View All</Link>
        </div>
        <div className="scrollbar-hide flex gap-5 overflow-x-auto pb-4">
          {complaints.map((item) => (
            <ComplaintCard key={item.id} complaint={item} onUpvote={upvote} isUpvoted={Boolean(userUpvotes[item.id])} />
          ))}
        </div>
      </MotionSection>

      <section className="terracotta-texture section-pad">
        <div className="section-shell grid gap-8 md:grid-cols-2">
          <div className="kolam-border rounded-2xl bg-[#fff8ef]/90 p-7 shadow-card">
            <h3 className="font-heading text-2xl font-bold">Our Core Values</h3>
            <div className="mt-4 space-y-4 font-body text-sm text-[#5f4d3c]">
              <p>🎯 <span className="font-semibold">Nagrik First</span> - Citizen complaints prioritized by real need</p>
              <p>⚡ <span className="font-semibold">Turant Samadhan</span> - Instant AI-powered solutions</p>
              <p>🔍 <span className="font-semibold">Poori Transparency</span> - Track every step of resolution</p>
            </div>
          </div>

          <div className="kolam-border rounded-2xl bg-[#fff8ef]/90 p-7 shadow-card">
            <h3 className="font-heading text-2xl font-bold">Locality to City Impact</h3>
            <p className="mt-3 font-body text-[#7A6652]">
              Every shikayat you file contributes to better roads, drainage, sanitation, and public trust across Nagarpalika zones.
            </p>
            <div className="mt-4 space-y-3 text-sm font-body">
              <div>
                <p className="mb-1 text-[#5f4d3c]">Roads Improved: 78%</p>
                <div className="h-2 rounded-full bg-[#ecdcca]"><div className="h-2 w-[78%] rounded-full bg-[#1A6B3C]" /></div>
              </div>
              <div>
                <p className="mb-1 text-[#5f4d3c]">Drainage Fixed: 61%</p>
                <div className="h-2 rounded-full bg-[#ecdcca]"><div className="h-2 w-[61%] rounded-full bg-[#E65100]" /></div>
              </div>
              <div>
                <p className="mb-1 text-[#5f4d3c]">Sanitation: 89%</p>
                <div className="h-2 rounded-full bg-[#ecdcca]"><div className="h-2 w-[89%] rounded-full bg-[#2E7D32]" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-[linear-gradient(100deg,#8f5327,#a9652f,#7a4b2e)] text-white">
        <div className="section-shell grid items-center gap-8 md:grid-cols-2">
          <div className="rounded-2xl bg-[#fff3e0] p-6 text-[#5c3a1f] shadow-card">
            <p className="font-heading text-5xl leading-none text-[#FF8C00]">&ldquo;</p>
            <p className="mt-2 font-body text-base">
              Maine ek shikayat file ki aur 5 din mein sadak theek ho gayi!
            </p>
            <p className="mt-3 font-accent text-sm font-semibold">- Priya Sharma, Subhash Nagar Resident, Bhopal</p>
          </div>

          <div>
            <h2 className="font-heading text-3xl font-extrabold md:text-4xl">Join Citizens Building Better Sheher Infrastructure</h2>
            <p className="mt-3 max-w-lg font-body text-[#ffddbf]">
              Real complaints, real civic accountability. Start your first report and help your city improve faster.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="mt-5 rounded-lg bg-white px-8 py-3 font-accent text-base font-semibold text-[#8a4f22]"
            >
              Shuru Karein
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#F5F0E8] py-14">
        <div className="section-shell grid gap-6 text-center md:grid-cols-4">
          {[
            { value: "23", label: "Cities" },
            { value: "142", label: "Localities" },
            { value: "47K+", label: "Complaints" },
            { value: "31K+", label: "Resolved" },
          ].map((item, index) => (
            <div key={item.label} className={`px-3 ${index < 3 ? "md:border-r md:border-[#FF8C0040]" : ""}`}>
              <p className="font-heading text-5xl font-extrabold text-[#1A6B3C]">{item.value}</p>
              <p className="mt-1 font-body text-sm text-[#7A6652]">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell section-pad">
        <h2 className="section-title">Core Platform Features</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: "🧠", title: "AI Solution Engine", desc: "Samadhan suggestions mapped to department workflows." },
            { icon: "📍", title: "Live Location Pinpointing", desc: "Drop a map pin or use GPS for locality accuracy." },
            { icon: "📸", title: "Photo Evidence Upload", desc: "Before/after visibility for citizens and city officers." },
            { icon: "📡", title: "Real-time Status Tracking", desc: "Filed -> Assigned -> In Review -> Resolved." },
            { icon: "🗂️", title: "City-level Dashboard", desc: "Officers work within location scope jurisdiction." },
            { icon: "🤝", title: "Nagrik Transparency", desc: "Public complaint visibility with upvote signals." },
          ].map((item) => (
            <MotionDiv
              key={item.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="kolam-border rounded-2xl bg-card p-5 shadow-card"
            >
              <div className="text-2xl">{item.icon}</div>
              <h3 className="mt-3 font-body font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[#7A6652]">{item.desc}</p>
            </MotionDiv>
          ))}
        </div>
      </section>

      <Footer />
      <ChatbotWidget />
    </div>
  );
};

export default Home;
