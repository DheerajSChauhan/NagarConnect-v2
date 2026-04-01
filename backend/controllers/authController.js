const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabase");
const supabaseClient = require("../config/supabaseClient");

const idStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/id-proofs/");
  },
  filename: (req, file, cb) => {
    cb(null, `id-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});

const idUpload = multer({
  storage: idStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and PDF files are allowed for ID proof"), false);
    }
  },
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

const toUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  state: user.state || "",
  district: user.district || "",
  city: user.city || "",
  locality: user.locality || "",
  ward: user.ward || null,
  department: user.department || "",
  employeeId: user.employee_id || "",
});

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      name,
      email,
      password,
      phone,
      role,
      state,
      district,
      city,
      locality,
      department,
      employeeId,
    } = req.body;

    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name, state, district, city, locality, phone },
      },
    });

    if (authError) {
      return res.status(400).json({ success: false, error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ success: false, error: "User registration failed" });
    }

    // Upsert avoids duplicate-profile failure on retries.
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .upsert(
        {
          id: authData.user.id,
          name,
          email,
          state: state || "",
          district: district || "",
          city: city || "",
          locality: locality || "",
          ward: "",
          phone,
          role: role || "citizen",
          department: department || "",
          employee_id: employeeId || "",
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (profileError) throw profileError;

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email before login.",
      user: toUserResponse(userProfile),
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Please enter email and password" });
    }

    const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({ success: false, error: authError.message });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (userError) throw userError;

    res.status(200).json({
      success: true,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: user ? toUserResponse(user) : { id: data.user.id, email: data.user.email, role: "user" },
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return res.status(404).json({ success: false, error: "User profile not found" });
    }

    res.status(200).json({
      success: true,
      user: toUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadIdProof = idUpload.single("idProof");

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, state, district, city, locality, department, employeeId } = req.body;
    const updatePayload = {
      name: name || req.user.name,
      phone: phone || req.user.phone || "Not specified",
      state: state || req.user.state || "",
      district: district || req.user.district || "",
      city: city || req.user.city || "",
      locality: locality || req.user.locality || "",
      department: department || req.user.department || "",
      employee_id: employeeId || req.user.employee_id || "",
    };

    const { data: user, error } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", req.user.id)
      .select("*")
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      user: toUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.getVerification = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("user_verifications")
      .select("id_type, id_number, id_proof_path, verification_status, verified_at, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && !String(error.message).toLowerCase().includes("relation")) {
      throw error;
    }

    if (!data) {
      return res.status(200).json({
        success: true,
        verification: {
          status: "not_verified",
        },
      });
    }

    res.status(200).json({
      success: true,
      verification: {
        idType: data.id_type,
        idNumber: data.id_number,
        idProofPath: data.id_proof_path,
        status: data.verification_status || "pending",
        verifiedAt: data.verified_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.submitVerification = async (req, res, next) => {
  try {
    const { idType, idNumber } = req.body;

    if (!idType || !idNumber) {
      return res.status(400).json({
        success: false,
        error: "idType and idNumber are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "ID proof file is required",
      });
    }

    const insertPayload = {
      user_id: req.user.id,
      id_type: idType,
      id_number: idNumber,
      id_proof_path: req.file.path,
      verification_status: "verified",
      verified_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_verifications")
      .insert(insertPayload)
      .select("id_type, id_number, id_proof_path, verification_status, verified_at")
      .single();

    if (error) {
      if (String(error.message).toLowerCase().includes("relation")) {
        return res.status(500).json({
          success: false,
          error: "Verification table missing. Run backend/scripts/profile_verification_schema.sql in Supabase SQL Editor.",
        });
      }
      throw error;
    }

    res.status(200).json({
      success: true,
      verification: {
        idType: data.id_type,
        idNumber: data.id_number,
        idProofPath: data.id_proof_path,
        status: data.verification_status,
        verifiedAt: data.verified_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Please provide username and password" });
    }

    const email = String(username).trim().toLowerCase();

    const { data: adminUser, error } = await supabase
      .from("users")
      .select("*")
      .in("role", ["admin", "mainAdmin", "super_admin", "superadmin", "superAdmin"])
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    if (!adminUser) {
      return res.status(401).json({ success: false, error: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, adminUser.password || "");
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid admin credentials" });
    }

    const token = generateToken(adminUser.id);
    res.status(200).json({
      success: true,
      token,
      user: toUserResponse(adminUser),
    });
  } catch (error) {
    next(error);
  }
};

exports.officerLogin = async (req, res, next) => {
  try {
    const { username, password, role, state, district, city } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: "Please provide username, password, and role",
      });
    }

    const email = String(username).trim().toLowerCase();
    const normalizedRole = String(role).trim().toLowerCase();
    const allowedRoles = ["city_officer", "district_officer", "state_officer", "dept_admin", "super_admin"];

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ success: false, error: "Invalid officer role" });
    }

    let query = supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("role", normalizedRole);

    if (normalizedRole === "city_officer" && city) {
      query = query.eq("city", city);
    }
    if (normalizedRole === "district_officer" && district) {
      query = query.eq("district", district);
    }
    if (normalizedRole === "state_officer" && state) {
      query = query.eq("state", state);
    }

    const { data: officer, error } = await query.maybeSingle();

    if (error) throw error;
    if (!officer) {
      return res.status(401).json({ success: false, error: "Officer not found for selected location scope" });
    }

    const isMatch = await bcrypt.compare(password, officer.password || "");
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = generateToken(officer.id);
    res.status(200).json({
      success: true,
      token,
      user: toUserResponse(officer),
    });
  } catch (error) {
    next(error);
  }
};
