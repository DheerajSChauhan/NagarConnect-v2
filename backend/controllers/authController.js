const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const supabase = require("../config/supabase");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingUser) {
      return res.status(400).json({ success: false, error: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: user, error: createError } = await supabase
      .from("users")
      .insert({
        name,
        email,
        password: hashedPassword,
        ward,
        phone,
        role: "user",
      })
      .select("id, name, email, role, ward")
      .single();

    if (createError) throw createError;

    const token = generateToken(user.id);
    res.status(201).json({
      success: true,
      token,
      user: toUserResponse(user),
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

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, role, ward, password")
      .eq("email", email)
      .maybeSingle();

    if (userError) throw userError;
    if (!user || !user.password) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = generateToken(user.id);
    res.status(200).json({
      success: true,
      token,
      user: toUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (username !== "Ritika" || password !== "Ritika@11") {
      return res.status(401).json({ success: false, error: "Invalid admin credentials" });
    }

    let adminUser;
    const { data: existingAdmin, error: existingError } = await supabase
      .from("users")
      .select("id, name, email, role, ward, password")
      .eq("role", "admin")
      .eq("email", "admin@wardwatch.com")
      .maybeSingle();

    if (existingError) throw existingError;

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("Ritika@11", 10);
      const { data: createdAdmin, error: createError } = await supabase
        .from("users")
        .insert({
          name: "Admin",
          email: "admin@wardwatch.com",
          password: hashedPassword,
          ward: "Admin Ward",
          phone: "0000000000",
          role: "admin",
        })
        .select("id, name, email, role, ward, password")
        .single();

      if (createError) throw createError;
      adminUser = createdAdmin;
    } else {
      adminUser = existingAdmin;
    }

    const isMatch = await bcrypt.compare(password, adminUser.password || "");
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid admin credentials" });
    }

    const token = generateToken(adminUser.id);
    res.status(200).json({
      success: true,
      token,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
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

    const { data: wardAdmin, error: wardAdminError } = await supabase
      .from("users")
      .select("id, name, email, role, ward, password")
      .eq("role", "wardAdmin")
      .eq("email", username)
      .eq("ward", String(wardNumber))
      .maybeSingle();

    if (wardAdminError) throw wardAdminError;
    if (!wardAdmin) {
      return res.status(401).json({ success: false, error: "Ward Admin not found for this ward" });
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

exports.googleLogin = async (req, res, next) => {
  try {
    const { tokenId } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, sub: googleId } = ticket.getPayload();

    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id, name, email, role, ward")
      .eq("email", email)
      .maybeSingle();

    if (existingError) throw existingError;

    let user = existingUser;
    if (!user) {
      const { data: createdUser, error: createError } = await supabase
        .from("users")
        .insert({
          name,
          email,
          google_id: googleId,
          ward: "Not specified",
          phone: "Not specified",
          role: "user",
        })
        .select("id, name, email, role, ward")
        .single();

      if (createError) throw createError;
      user = createdUser;
    }

    const token = generateToken(user.id);
    res.status(200).json({
      success: true,
      token,
      user: toUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, role, ward, phone, created_at")
      .eq("id", req.user.id)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        ...user,
        _id: user.id,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};
