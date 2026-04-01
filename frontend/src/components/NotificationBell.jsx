import { useMemo, useState } from "react";
import { FaBell } from "react-icons/fa";

const initialNotifications = [
  {
    id: "n1",
    text: "Your complaint NC-2025-0042 status changed to In Review",
    read: false,
  },
  {
    id: "n2",
    text: "City response team uploaded a resolution photo for NC-2025-0254",
    read: false,
  },
  {
    id: "n3",
    text: "3 users upvoted your public complaint",
    read: true,
  },
];

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const markRead = (id) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <FaBell />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h4>
          <div className="space-y-2">
            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => markRead(item.id)}
                className={`w-full rounded-xl p-2 text-left text-sm ${
                  item.read
                    ? "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    : "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                }`}
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationBell;
