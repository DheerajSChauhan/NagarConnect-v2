import PropTypes from 'prop-types';
import { motion } from "framer-motion";
import { FaArrowUp, FaMapMarkerAlt } from "react-icons/fa";
import PriorityBadge from "./PriorityBadge";

const MotionArticle = motion.article;

const statusClasses = {
  Pending: "bg-amber-100 text-amber-700",
  Assigned: "bg-sky-100 text-sky-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
};

const mediaByCategory = {
  Water: {
    gradient: "linear-gradient(135deg,#1565C0,#0D47A1)",
    emoji: "🌊",
    label: "Waterlogging",
  },
  Construction: {
    gradient: "linear-gradient(135deg,#E65100,#BF360C)",
    emoji: "🏗️",
    label: "Illegal Construction",
  },
  Road: {
    gradient: "linear-gradient(135deg,#2E7D32,#1B5E20)",
    emoji: "🚗",
    label: "Road & Pothole",
  },
  Sanitation: {
    gradient: "linear-gradient(135deg,#558B2F,#33691E)",
    emoji: "🗑️",
    label: "Garbage",
  },
  default: {
    gradient: "linear-gradient(135deg,#1A6B3C,#1A237E)",
    emoji: "📍",
    label: "City Issue",
  },
};

const ComplaintCard = ({ complaint, onUpvote, compact = false, isUpvoted = false }) => {
  const media = mediaByCategory[complaint.category] || mediaByCategory.default;

  return (
    <MotionArticle
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ type: "spring", stiffness: 250, damping: 18 }}
      className="kolam-border min-w-[280px] max-w-[360px] overflow-hidden rounded-2xl bg-card shadow-card"
    >
      <div className="relative h-40 overflow-hidden" style={{ background: media.gradient }}>
        <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_20%_40%,#ffffff_2px,transparent_2px),radial-gradient(circle_at_70%_60%,#ffffff_2px,transparent_2px)] [background-size:56px_56px]" />
        {complaint.category === "Water" ? (
          <div className="absolute inset-x-0 bottom-0 h-10 opacity-15 [background:repeating-radial-gradient(circle_at_0%_100%,#ffffff_0_8px,transparent_8px_16px)]" />
        ) : null}
        <div className="absolute inset-0 grid place-items-center text-center">
          <p className="text-5xl" aria-hidden="true">{media.emoji}</p>
          <p className="mt-1 font-accent text-sm font-semibold tracking-wide text-white">{media.label}</p>
        </div>
        <div className="absolute left-3 top-3">
          <PriorityBadge priority={complaint.priority} />
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold text-[#1C1008]">{complaint.title}</h3>
          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusClasses[complaint.status] || "bg-slate-100 text-slate-700"}`}>
            {complaint.status}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#7A6652]">
          <FaMapMarkerAlt className="text-civic" />
          <span className="line-clamp-1">{complaint.locationName}</span>
        </div>

        {compact === false && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#7A6652]">{complaint.date}</span>
            <button
              type="button"
              onClick={() => onUpvote?.(complaint.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium ${
                isUpvoted
                  ? "border-primary bg-primary text-white"
                  : "border-[#d6bfa3] text-primary hover:bg-[#f5e6d5]"
              }`}
            >
              <FaArrowUp />
              {complaint.upvotes}
            </button>
          </div>
        )}
      </div>
    </MotionArticle>
  );
};

ComplaintCard.propTypes = {
  complaint: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    category: PropTypes.string,
    status: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    locationName: PropTypes.string.isRequired,
    date: PropTypes.string,
    upvotes: PropTypes.number,
    image: PropTypes.string,
  }).isRequired,
  onUpvote: PropTypes.func,
  compact: PropTypes.bool,
  isUpvoted: PropTypes.bool,
};

ComplaintCard.defaultProps = {
  onUpvote: undefined,
  compact: false,
  isUpvoted: false,
};

export default ComplaintCard;
