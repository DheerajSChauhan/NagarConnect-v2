import { useMemo, useState } from "react";
import { FaArrowDown, FaArrowUp, FaRegCommentDots } from "react-icons/fa";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PriorityBadge from "../components/PriorityBadge";
import { forumPosts } from "../data/mockData";

const Forum = () => {
  const [sortBy, setSortBy] = useState("Hot");
  const [posts, setPosts] = useState(forumPosts);
  const [userVotes, setUserVotes] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});

  const sorted = useMemo(() => {
    const clone = [...posts];
    if (sortBy === "Most Upvoted") return clone.sort((a, b) => b.upvotes - a.upvotes);
    if (sortBy === "Urgent") {
      return clone.sort((a, b) => Number(b.priority === "urgent") - Number(a.priority === "urgent"));
    }
    if (sortBy === "New") return clone.reverse();
    return clone.sort((a, b) => b.comments - a.comments);
  }, [posts, sortBy]);

  const vote = (id, nextVote) => {
    const currentVote = userVotes[id] ?? 0;
    const finalVote = currentVote === nextVote ? 0 : nextVote;

    setPosts((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let upvotes = item.upvotes;
        let downvotes = item.downvotes;

        if (currentVote === 1) upvotes -= 1;
        if (currentVote === -1) downvotes -= 1;

        if (finalVote === 1) upvotes += 1;
        if (finalVote === -1) downvotes += 1;

        return {
          ...item,
          upvotes: Math.max(0, upvotes),
          downvotes: Math.max(0, downvotes),
        };
      })
    );

    setUserVotes((prev) => ({
      ...prev,
      [id]: finalVote,
    }));
  };

  const toggleComments = (id) => {
    setOpenComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addComment = (id) => {
    const nextText = String(commentDrafts[id] || "").trim();
    if (!nextText) return;

    setPosts((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const comment = {
          id: `${id}-${Date.now()}`,
          author: "You",
          text: nextText,
          time: "just now",
        };
        return {
          ...item,
          comments: (item.comments || 0) + 1,
          thread: [...(item.thread || []), comment],
        };
      })
    );

    setCommentDrafts((prev) => ({ ...prev, [id]: "" }));
    setOpenComments((prev) => ({ ...prev, [id]: true }));
  };

  const copyShareLink = async (post) => {
    const url = `${window.location.origin}/forum?post=${encodeURIComponent(post.id)}`;
    const text = `${post.title}\n${post.body}\n${url}`;
    try {
      await navigator.clipboard.writeText(text);
      window.alert("Complaint link copied. You can share it now.");
    } catch {
      window.prompt("Copy this complaint link", text);
    }
  };

  const shareOnWhatsApp = (post) => {
    const url = `${window.location.origin}/forum?post=${encodeURIComponent(post.id)}`;
    const text = `${post.title} - ${post.body} ${url}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-app dark:bg-[#0D1117]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-3xl font-bold">Discussion Forum</h1>
          <div className="flex gap-2">
            {["Hot", "New", "Urgent", "Most Upvoted"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSortBy(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  sortBy === item ? "bg-civic-blue text-white" : "bg-white text-slate-700"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {sorted.map((post) => (
            <article key={post.id} className="rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
              <div className="flex gap-4">
                <div className="flex min-w-[56px] flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => vote(post.id, 1)}
                    className={`rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                      userVotes[post.id] === 1 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : ""
                    }`}
                  >
                    <FaArrowUp />
                  </button>
                  <span className="font-bold">{post.upvotes}</span>
                  <button
                    type="button"
                    onClick={() => vote(post.id, -1)}
                    className={`rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                      userVotes[post.id] === -1 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : ""
                    }`}
                  >
                    <FaArrowDown />
                  </button>
                </div>

                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{post.author}</span>
                    <span>•</span>
                    <span>{post.time}</span>
                    <span>•</span>
                    <span>{post.category}</span>
                    <PriorityBadge priority={post.priority} />
                  </div>
                  <h2 className="font-heading text-xl font-bold">{post.title}</h2>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{post.body}</p>

                  <div className="mt-4 flex items-center gap-6 text-sm text-slate-500">
                    <button type="button" onClick={() => toggleComments(post.id)} className="inline-flex items-center gap-2 font-semibold hover:text-civic-blue">
                      <FaRegCommentDots /> {post.comments} comments
                    </button>
                    <button type="button" onClick={() => copyShareLink(post)} className="font-semibold text-civic-blue">Share this complaint</button>
                    <button type="button" onClick={() => shareOnWhatsApp(post)} className="font-semibold text-emerald-700">Share on WhatsApp</button>
                  </div>

                  {openComments[post.id] ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                      <p className="font-semibold">Comments</p>
                      <div className="mt-3 space-y-2">
                        {(post.thread || []).length > 0 ? (
                          (post.thread || []).map((comment) => (
                            <article key={comment.id} className="rounded-lg bg-white p-2 dark:bg-slate-900">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{comment.author}</p>
                              <p className="mt-1 text-slate-700 dark:text-slate-200">{comment.text}</p>
                              <p className="mt-1 text-[11px] text-slate-500">{comment.time}</p>
                            </article>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">No comments yet. Start the discussion.</p>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={commentDrafts[post.id] || ""}
                          onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))}
                          placeholder="Write a comment"
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => addComment(post.id)}
                          className="rounded-lg bg-[#1A6B3C] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  ) : null}
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

export default Forum;
