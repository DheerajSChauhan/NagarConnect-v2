const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const supabase = require("../config/supabase");
const supabaseClient = require("../config/supabaseClient");

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
  ward: user.ward,
});

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, ward, phone } = req.body;

    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name, ward, phone },
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
          ward,
          phone,
          role: "user",
        },
        { onConflict: "id" }
      )
      .select("id, name, email, role, ward")
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
      .select("id, name, email, role, ward")
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
      .select("id, name, email, role, ward")
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

exports.adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Please provide username and password" });
    }

    const email = String(username).trim().toLowerCase();

    const { data: adminUser, error } = await supabase
      .from("users")
      .select("id, name, email, role, ward, password")
      .in("role", ["admin", "mainAdmin", "superadmin", "superAdmin"])
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

exports.wardAdminLogin = async (req, res, next) => {
  try {
    const { username, password, wardNumber } = req.body;
    if (!username || !password || !wardNumber) {
      return res.status(400).json({
        success: false,
        error: "Please provide username, password, and ward number",
      });
    }

    const email = String(username).trim().toLowerCase();
    const ward = String(wardNumber).trim();

    const { data: wardAdmin, error } = await supabase
      .from("users")
      .select("id, name, email, role, ward, password")
      .in("role", ["wardAdmin", "wardadmin", "ward_admin"])
      .eq("email", email)
      .eq("ward", ward)
      .maybeSingle();

    if (error) throw error;
    if (!wardAdmin) {
      return res.status(401).json({ success: false, error: "Ward admin not found for this ward" });
    }

    const isMatch = await bcrypt.compare(password, wardAdmin.password || "");
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = generateToken(wardAdmin.id);
    res.status(200).json({
      success: true,
      token,
      user: toUserResponse(wardAdmin),
    });
  } catch (error) {
    next(error);
  }
};
