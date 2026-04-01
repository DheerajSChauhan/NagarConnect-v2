import { useState } from "react";
import { FaComments, FaPaperPlane, FaTimes } from "react-icons/fa";

const cannedReplies = [
  "For waterlogging complaints, include nearest landmark and depth of water.",
  "For illegal construction, upload at least one clear image and address details.",
  "To track complaint status, enter your complaint ID in My Complaints.",
];

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, role: "bot", text: "Need help? Ask NagarConnect AI." },
  ]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), role: "user", text: input };
    const botMsg = {
      id: Date.now() + 1,
      role: "bot",
      text: cannedReplies[Math.floor(Math.random() * cannedReplies.length)],
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="mb-3 w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-700 to-civic-blue px-4 py-3 text-white">
            <p className="font-semibold">NagarConnect AI</p>
            <button type="button" onClick={() => setOpen(false)}>
              <FaTimes />
            </button>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto p-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-xl px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "ml-auto w-fit bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-700">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && sendMessage()}
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              placeholder="Ask about complaints, departments..."
            />
            <button
              type="button"
              onClick={sendMessage}
              className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-xl text-white shadow-xl transition hover:scale-105 hover:bg-emerald-700"
        aria-label="Open NagarConnect AI chat"
      >
        <FaComments />
      </button>
    </div>
  );
};

export default ChatbotWidget;
