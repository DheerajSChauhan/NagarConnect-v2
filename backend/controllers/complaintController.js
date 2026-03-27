const { validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabase");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/complaints/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

const COMPLAINT_SELECT = `
  id,
  title,
  ward,
  description,
  category,
  location,
  status,
  priority,
  image,
  user_id,
  created_at,
  resolved_at,
  user:users!complaints_user_id_fkey(id, name, email, ward)
`;

const formatComplaint = (row) => ({
  _id: row.id,
  title: row.title,
  ward: row.ward,
  description: row.description,
  category: row.category,
  location: row.location,
  status: row.status,
  priority: row.priority,
  image: row.image,
  user: row.user
    ? {
        _id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        ward: row.user.ward,
      }
    : row.user_id,
  createdAt: row.created_at,
  resolvedAt: row.resolved_at,
});

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private
exports.uploadImage = upload.single("image");
exports.createComplaint = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, location, priority } = req.body;

    const complaintData = {
      title,
      description,
      category,
      location,
      priority: priority || "Medium",
      user_id: req.user.id,
      ward: req.user.ward,
    };

    // Add image path if file was uploaded
    if (req.file) {
      complaintData.image = req.file.path;
    }

    const { data: complaint, error } = await supabase
      .from("complaints")
      .insert(complaintData)
      .select(COMPLAINT_SELECT)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      complaint: formatComplaint(complaint),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get all complaints for logged in user
// @route   GET /api/complaints/my
// @access  Private
exports.getMyComplaints = async (req, res) => {
  try {
    const { data: complaints, error } = await supabase
      .from("complaints")
      .select(COMPLAINT_SELECT)
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted = (complaints || []).map(formatComplaint);

    res.status(200).json({
      success: true,
      count: formatted.length,
      complaints: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete complaint (User can delete their own)
// @route   DELETE /api/complaints/:id
// @access  Private
exports.deleteComplaint = async (req, res) => {
  try {
    const { data: complaint, error: findError } = await supabase
      .from("complaints")
      .select("id, user_id")
      .eq("id", req.params.id)
      .maybeSingle();

    if (findError) throw findError;

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
      });
    }

    // Check if user owns the complaint or is admin
    if (complaint.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this complaint",
      });
    }

    const { error: deleteError } = await supabase.from("complaints").delete().eq("id", req.params.id);
    if (deleteError) throw deleteError;

    res.status(200).json({
      success: true,
      message: "Complaint deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get all complaints (Admin only)
// @route   GET /api/complaints
// @access  Private/Admin
exports.getAllComplaints = async (req, res) => {
  try {
    const { data: complaints, error } = await supabase
      .from("complaints")
      .select(COMPLAINT_SELECT)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted = (complaints || []).map(formatComplaint);

    res.status(200).json({
      success: true,
      count: formatted.length,
      complaints: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update complaint status (Admin only)
// @route   PUT /api/complaints/:id
// @access  Private/Admin
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const updatePayload = {
      status,
      resolved_at: status === "Resolved" ? new Date().toISOString() : null,
    };

    const { data: complaint, error } = await supabase
      .from("complaints")
      .update(updatePayload)
      .eq("id", req.params.id)
      .select(COMPLAINT_SELECT)
      .maybeSingle();

    if (error) throw error;
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    res.status(200).json({ success: true, complaint: formatComplaint(complaint) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// @desc    Get complaints by ward number
// @route   GET /api/complaints/ward/:wardNumber
// @access  Private
// @desc    Get complaints by ward number
// @route   GET /api/complaints/ward/:wardNumber
// @access  Private
exports.getComplaintsByWard = async (req, res) => {
  try {
    const { wardNumber } = req.params;

    const { data: complaints, error } = await supabase
      .from("complaints")
      .select(COMPLAINT_SELECT)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const normalizedWard = String(wardNumber).toLowerCase().trim();
    const filtered = (complaints || [])
      .map(formatComplaint)
      .filter((c) => {
        const complaintWard = String(c.ward || "").toLowerCase().trim();
        const userWard = String(c.user?.ward || "").toLowerCase().trim();
        return complaintWard.includes(normalizedWard) || userWard.includes(normalizedWard);
      });

    res.status(200).json({
      success: true,
      count: filtered.length,
      complaints: filtered,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


// Export multer upload middleware
exports.uploadImage = upload.single("image");
