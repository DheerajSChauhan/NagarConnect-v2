import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Globe,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const primaryLinks = [
  { to: "/", labelKey: "nav.home", fallback: "Home", requiresAuth: false },
  { to: "/file-complaint", labelKey: "nav.fileComplaint", fallback: "File Complaint", requiresAuth: true },
  { to: "/my-complaints", labelKey: "nav.myComplaints", fallback: "My Complaints", requiresAuth: true },
  { to: "/map", labelKey: "nav.publicMap", fallback: "Public Map", requiresAuth: false },
  { to: "/forum", labelKey: "nav.forum", fallback: "Forum", requiresAuth: false },
];

const moreLinks = [
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/officer-dashboard", label: "Officer Dashboard" },
  { to: "/admin", label: "Admin" },
];

const notifications = [
  "Bhopal drainage complaint moved to In Progress",
  "Road repair ticket NC-2025-0254 marked Assigned",
  "Sanitation drive update posted for New Market",
];

const Navbar = () => {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { language, setLanguage, tr } = useLanguage();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const moreRef = useRef(null);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
    setProfileOpen(false);
    setNotificationOpen(false);
  }, [location.pathname]);

  const visiblePrimaryLinks = useMemo(
    () => primaryLinks.filter((item) => isAuthenticated || !item.requiresAuth),
    [isAuthenticated]
  );

  const firstName = user?.name?.trim()?.split(" ")[0] || "Citizen";
  const avatarLetter = user?.avatar || firstName.charAt(0).toUpperCase();
  const hasUnreadNotifications = isAuthenticated;

  const renderDesktopLink = (item) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        `relative py-1 font-accent text-[15px] font-semibold tracking-[0.5px] transition-colors ${
          isActive ? "text-[#1A6B3C]" : "text-[#1C1008] hover:text-[#1A6B3C]"
        } after:absolute after:-bottom-[6px] after:left-0 after:h-[2px] after:bg-[#1A6B3C] after:transition-all after:duration-200 ${
          isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
        }`
      }
    >
      {tr(item.labelKey, item.fallback)}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-[1000] bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
      <nav className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 md:h-16 md:px-6">
        <Link to="/" className="flex w-[180px] items-center gap-2.5">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#eef2ff]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" stroke="#1A237E" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="1.2" fill="#1A237E" />
              <path d="M12 3.5V20.5M3.5 12H20.5M6.6 6.6L17.4 17.4M17.4 6.6L6.6 17.4" stroke="#1A237E" strokeWidth="1" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="font-heading text-[22px] font-extrabold text-[#1A6B3C]">NagarConnect</p>
            <p className="font-body text-[10px] text-[#7A6652]">नागर कनेक्ट</p>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {visiblePrimaryLinks.map(renderDesktopLink)}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 py-1 font-accent text-[15px] font-semibold tracking-[0.5px] text-[#1C1008] transition hover:text-[#1A6B3C]"
            >
              {tr("nav.more", "More")} <ChevronDown size={16} />
            </button>
            {moreOpen ? (
              <div className="absolute right-0 top-9 w-52 rounded-xl border border-[#E7DCCA] bg-white p-2 shadow-lg">
                {moreLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="block rounded-lg px-3 py-2 text-sm text-[#1C1008] hover:bg-[#F5F0E8]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="inline-flex h-7 items-center rounded-full border border-[#E0D5C5] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              className={`h-6 rounded-full px-2.5 text-[11px] font-semibold ${
                language === "hi" ? "bg-[#1A6B3C] text-white" : "text-[#1C1008]"
              }`}
            >
              हिं
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`h-6 rounded-full px-2.5 text-[11px] font-semibold ${
                language === "en" ? "bg-[#1A6B3C] text-white" : "text-[#1C1008]"
              }`}
            >
              EN
            </button>
          </div>

          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setNotificationOpen((prev) => !prev)}
              className="relative rounded-lg p-1.5 text-[#1C1008] hover:bg-[#F6F1E8]"
              aria-label="Notifications"
            >
              <Bell size={22} />
              {hasUnreadNotifications ? (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#C62828]" />
              ) : null}
            </button>
            {notificationOpen ? (
              <div className="absolute right-0 top-10 w-80 rounded-xl border border-[#E7DCCA] bg-white p-3 shadow-lg">
                <p className="mb-2 font-accent text-sm font-semibold text-[#1C1008]">{tr("nav.notifications", "Notifications")}</p>
                <div className="space-y-2">
                  {notifications.map((item) => (
                    <p key={item} className="rounded-lg bg-[#F8F3EA] px-3 py-2 text-xs text-[#5e4a37]">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {!isAuthenticated ? (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="rounded-lg border-2 border-[#1A6B3C] bg-transparent px-4 py-1.5 font-accent text-sm font-semibold text-[#1A6B3C] transition hover:bg-[#1A6B3C] hover:text-white"
            >
              {`${tr("login", "Login")} / ${tr("signUp", "Sign Up")}`}
            </button>
          ) : (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F6F1E8]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#1A6B3C] bg-[#EAF4EC] text-sm font-bold text-[#1A6B3C]">
                  {avatarLetter}
                </span>
                <span className="font-accent text-sm font-semibold text-[#1C1008]">{firstName}</span>
              </button>
              {profileOpen ? (
                <div className="absolute right-0 top-11 w-44 rounded-xl border border-[#E7DCCA] bg-white p-2 shadow-lg">
                  <Link to="/profile" className="block rounded-lg px-3 py-2 text-sm hover:bg-[#F5F0E8]">{tr("nav.profile", "My Profile")}</Link>
                  <Link to="/my-complaints" className="block rounded-lg px-3 py-2 text-sm hover:bg-[#F5F0E8]">{tr("nav.myComplaints", "My Complaints")}</Link>
                  <Link to="/settings" className="block rounded-lg px-3 py-2 text-sm hover:bg-[#F5F0E8]">{tr("nav.settings", "Settings")}</Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#C62828] hover:bg-[#FFF0F0]"
                  >
                    {tr("nav.logout", "Logout")}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-[#1C1008] md:hidden"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </nav>

      {mobileOpen ? (
        <>
          <button
            type="button"
            aria-label="Close mobile drawer overlay"
            className="fixed inset-0 z-[1001] bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-[1002] h-screen w-[280px] translate-x-0 bg-[#FFFDF7] p-4 shadow-2xl transition-transform duration-300 md:hidden">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-heading text-xl font-bold text-[#1A6B3C]">{tr("nav.menu", "Menu")}</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-[#1C1008]"
                aria-label="Close mobile menu"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-1">
              {primaryLinks.map((item) => {
                if (!isAuthenticated && item.requiresAuth) {
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => openAuthModal("login")}
                      className="block w-full rounded-lg px-3 py-2 text-left font-accent text-sm font-semibold text-[#1C1008] hover:bg-[#F3EADD]"
                    >
                      {tr(item.labelKey, item.fallback)}
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="block rounded-lg px-3 py-2 font-accent text-sm font-semibold text-[#1C1008] hover:bg-[#F3EADD]"
                  >
                    {tr(item.labelKey, item.fallback)}
                  </Link>
                );
              })}

              <details className="rounded-lg bg-[#F9F3EA]">
                <summary className="cursor-pointer list-none px-3 py-2 font-accent text-sm font-semibold text-[#1C1008]">
                  <span className="inline-flex items-center gap-1">
                    {tr("nav.more", "More")} <ChevronDown size={14} />
                  </span>
                </summary>
                <div className="pb-1">
                  {moreLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="mx-2 mb-1 block rounded-lg px-3 py-2 text-sm text-[#1C1008] hover:bg-[#EEE1D0]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            </div>

            <div className="mt-6 rounded-xl border border-[#E4D7C4] p-3">
              <p className="mb-2 inline-flex items-center gap-2 font-accent text-sm text-[#5e4a37]"><Globe size={16} /> {tr("settings.language", "Language")}</p>
              <div className="inline-flex h-7 items-center rounded-full border border-[#E0D5C5] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setLanguage("hi")}
                  className={`h-6 rounded-full px-2.5 text-[11px] font-semibold ${
                    language === "hi" ? "bg-[#1A6B3C] text-white" : "text-[#1C1008]"
                  }`}
                >
                  हिं
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`h-6 rounded-full px-2.5 text-[11px] font-semibold ${
                    language === "en" ? "bg-[#1A6B3C] text-white" : "text-[#1C1008]"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="w-full rounded-lg border-2 border-[#1A6B3C] px-4 py-2 font-accent font-semibold text-[#1A6B3C]"
                >
                  {`${tr("login", "Login")} / ${tr("signUp", "Sign Up")}`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={logout}
                  className="w-full rounded-lg bg-[#C62828] px-4 py-2 font-accent font-semibold text-white"
                >
                  {tr("nav.logout", "Logout")}
                </button>
              )}
            </div>
          </aside>
        </>
      ) : null}
    </header>
  );
};

export default Navbar;
