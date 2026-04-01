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
  *,
  user:users!complaints_user_id_fkey(*)
`;

const normalizeText = (value, fallback = "") => {
  const parsed = String(value ?? "").trim();
  return parsed || fallback;
};

const inferUrbanBodyType = (value) => {
  const parsed = normalizeText(value).toLowerCase();
  const allowed = ["nagar_nigam", "nagar_palika", "nagar_panchayat", "gram_panchayat"];
  if (allowed.includes(parsed)) {
    return parsed;
  }
  return "nagar_nigam";
};

const inferDepartment = (category) => {
  const value = normalizeText(category).toLowerCase();
  if (["road", "pothole", "construction"].some((item) => value.includes(item))) return "Roads";
  if (["water", "supply", "sewage", "drain"].some((item) => value.includes(item))) return "Water";
  if (["sanitation", "garbage", "waste", "clean"].some((item) => value.includes(item))) return "Sanitation";
  if (["light", "electric"].some((item) => value.includes(item))) return "Electricity";
  return "Other";
};

const formatComplaint = (row) => ({
  _id: row.id,
  title: row.title,
  state: row.state || row.user?.state || "",
  stateCode: row.state_code || "",
  district: row.district || row.user?.district || "",
  city: row.city || row.user?.city || "",
  urbanBodyType: row.urban_body_type || "",
  locality: row.locality || row.location || "",
  latitude: row.latitude,
  longitude: row.longitude,
  assignedDepartment: row.assigned_department,
  assignedOfficerId: row.assigned_officer_id,
  ward: row.ward || row.user?.ward || null,
  description: row.description,
  category: row.category,
  location: row.location || [row.locality, row.city, row.district, row.state].filter(Boolean).join(", "),
  status: row.status,
  priority: row.priority,
  image: row.image,
  user: row.user
    ? {
        _id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        role: row.user.role,
        state: row.user.state || "",
        district: row.user.district || "",
        city: row.user.city || "",
        locality: row.user.locality || "",
        ward: row.user.ward || null,
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

    const {
      title,
      description,
      category,
      location,
      priority,
      state,
      stateCode,
      district,
      city,
      urbanBodyType,
      locality,
      latitude,
      longitude,
    } = req.body;

    const legacyComplaintData = {
      title,
      description,
      category,
      location,
      priority: priority || "Medium",
      user_id: req.user.id,
      ward: req.user.ward || null,
    };

    const complaintData = {
      title,
      description,
      category,
      location: normalizeText(location, [locality, city, district, state].filter(Boolean).join(", ")),
      priority: priority || "Medium",
      user_id: req.user.id,
      state: normalizeText(state, req.user.state || ""),
      state_code: normalizeText(stateCode),
      district: normalizeText(district, req.user.district || ""),
      city: normalizeText(city, req.user.city || ""),
      urban_body_type: inferUrbanBodyType(urbanBodyType),
      locality: normalizeText(locality),
      latitude: latitude !== undefined && latitude !== null && String(latitude).trim() !== "" ? Number(latitude) : null,
      longitude: longitude !== undefined && longitude !== null && String(longitude).trim() !== "" ? Number(longitude) : null,
      assigned_department: inferDepartment(category),
      assigned_officer_id: null,
      ward: req.user.ward || null,
    };

    // Add image path if file was uploaded
    if (req.file) {
      complaintData.image = req.file.path;
      legacyComplaintData.image = req.file.path;
    }

    let complaint = null;
    let error = null;

    const extendedInsert = await supabase.from("complaints").insert(complaintData).select(COMPLAINT_SELECT).single();
    complaint = extendedInsert.data;
    error = extendedInsert.error;

    if (error && /column/i.test(String(error.message || ""))) {
      const legacyInsert = await supabase
        .from("complaints")
        .insert(legacyComplaintData)
        .select(COMPLAINT_SELECT)
        .single();
      complaint = legacyInsert.data;
      error = legacyInsert.error;
    }

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

// @desc    Get complaints in officer scope
// @route   GET /api/complaints/scope
// @access  Private
exports.getComplaintsByOfficerScope = async (req, res) => {
  try {
    const role = String(req.user.role || "").toLowerCase();

    let query = supabase.from("complaints").select(COMPLAINT_SELECT).order("created_at", { ascending: false });

    if (role === "city_officer") {
      query = query.eq("city", req.user.city || "");
    } else if (role === "district_officer") {
      query = query.eq("district", req.user.district || "");
    } else if (role === "state_officer") {
      query = query.eq("state", req.user.state || "");
    } else if (!["super_admin", "admin"].includes(role)) {
      query = query.eq("user_id", req.user.id);
    }

    const { data: complaints, error } = await query;
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

// @desc    Get public complaints for map
// @route   GET /api/complaints/public
// @access  Public
exports.getPublicComplaints = async (req, res) => {
  try {
    const { data: complaints, error } = await supabase
      .from("complaints")
      .select(COMPLAINT_SELECT)
      .order("created_at", { ascending: false })
      .limit(300);

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
