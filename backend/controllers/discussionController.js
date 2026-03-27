const supabase = require("../config/supabase");

const DISCUSSION_SELECT = `
  id,
  message,
  language,
  user_id,
  created_at,
  user:users!discussions_user_id_fkey(id, name, ward)
`;

const formatDiscussion = (row, likes = []) => ({
  _id: row.id,
  message: row.message,
  language: row.language,
  likes,
  user: row.user
    ? {
        _id: row.user.id,
        name: row.user.name,
        ward: row.user.ward,
      }
    : row.user_id,
  createdAt: row.created_at,
});

// @desc    Get all discussions with pagination
// @route   GET /api/discussions
// @access  Private
exports.getDiscussions = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const { data: discussions, error } = await supabase
      .from("discussions")
      .select(DISCUSSION_SELECT)
      .order("created_at", { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

    const { count: total, error: countError } = await supabase
      .from("discussions")
      .select("id", { count: "exact", head: true });

    if (countError) throw countError;

    const discussionIds = (discussions || []).map((d) => d.id);
    const likeMap = new Map();

    if (discussionIds.length > 0) {
      const { data: likesRows, error: likesError } = await supabase
        .from("discussion_likes")
        .select("discussion_id, user_id")
        .in("discussion_id", discussionIds);

      if (likesError) throw likesError;

      for (const like of likesRows || []) {
        if (!likeMap.has(like.discussion_id)) likeMap.set(like.discussion_id, []);
        likeMap.get(like.discussion_id).push(like.user_id);
      }
    }

    const formatted = (discussions || []).map((d) => formatDiscussion(d, likeMap.get(d.id) || []));

    res.status(200).json({
      success: true,
      discussions: formatted,
      pagination: {
        page,
        limit,
        total: total || 0,
        pages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create new discussion message
// @route   POST /api/discussions
// @access  Private
exports.createDiscussion = async (req, res) => {
  try {
    const { message, language } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Please provide a message",
      });
    }

    const { data: discussion, error } = await supabase
      .from("discussions")
      .insert({
        message: message.trim(),
        language: language || "en",
        user_id: req.user.id,
      })
      .select(DISCUSSION_SELECT)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      discussion: formatDiscussion(discussion, []),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete discussion message
// @route   DELETE /api/discussions/:id
// @access  Private
exports.deleteDiscussion = async (req, res) => {
  try {
    const { data: discussion, error: findError } = await supabase
      .from("discussions")
      .select("id, user_id")
      .eq("id", req.params.id)
      .maybeSingle();

    if (findError) throw findError;

    if (!discussion) {
      return res.status(404).json({
        success: false,
        error: "Discussion not found",
      });
    }

    // Check if user owns the discussion or is admin
    if (discussion.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this message",
      });
    }

    const { error: deleteError } = await supabase.from("discussions").delete().eq("id", req.params.id);
    if (deleteError) throw deleteError;

    res.status(200).json({
      success: true,
      message: "Discussion deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Like/Unlike a discussion
// @route   PUT /api/discussions/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
  try {
    const { data: discussion, error: discussionError } = await supabase
      .from("discussions")
      .select(DISCUSSION_SELECT)
      .eq("id", req.params.id)
      .maybeSingle();

    if (discussionError) throw discussionError;

    if (!discussion) {
      return res.status(404).json({
        success: false,
        error: "Discussion not found",
      });
    }

    const userId = req.user.id;

    const { data: existingLike, error: likeLookupError } = await supabase
      .from("discussion_likes")
      .select("discussion_id, user_id")
      .eq("discussion_id", req.params.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (likeLookupError) throw likeLookupError;

    if (existingLike) {
      const { error: unlikeError } = await supabase
        .from("discussion_likes")
        .delete()
        .eq("discussion_id", req.params.id)
        .eq("user_id", userId);

      if (unlikeError) throw unlikeError;
    } else {
      const { error: likeError } = await supabase.from("discussion_likes").insert({
        discussion_id: req.params.id,
        user_id: userId,
      });

      if (likeError) throw likeError;
    }

    const { data: likesRows, error: likesError } = await supabase
      .from("discussion_likes")
      .select("user_id")
      .eq("discussion_id", req.params.id);

    if (likesError) throw likesError;

    const likes = (likesRows || []).map((row) => row.user_id);

    res.status(200).json({
      success: true,
      discussion: formatDiscussion(discussion, likes),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

