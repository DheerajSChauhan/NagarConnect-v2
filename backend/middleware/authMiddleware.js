const supabase = require("../config/supabase");
const supabaseClient = require("../config/supabaseClient");
const jwt = require("jsonwebtoken");

const normalizeRole = (role) => {
  const value = String(role || "").trim().toLowerCase();
  if (["admin", "mainadmin", "superadmin"].includes(value)) return "admin";
  if (["wardadmin", "ward_admin"].includes(value)) return "wardAdmin";
  return value || "user";
};

const getProfileById = async (id) => {
  const { data: userProfile, error } = await supabase
    .from("users")
    .select("id, name, email, role, ward")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("User profile lookup failed");
  if (!userProfile) throw new Error("User profile not found");
  return userProfile;
};

// Protect routes
exports.protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    // Verify Supabase token first.
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (!authError && user) {
      const { data: userProfile, error } = await supabase
        .from("users")
        .select("id, name, email, role, ward")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        return res.status(401).json({ message: "User profile lookup failed" });
      }

      let effectiveProfile = userProfile;

      // First OAuth login can have a valid auth user but no row in public.users yet.
      if (!effectiveProfile) {
        const fallbackName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "User";

        const { data: createdProfile, error: createError } = await supabase
          .from("users")
          .upsert(
            {
              id: user.id,
              name: fallbackName,
              email: user.email,
              role: "user",
              ward: "Not specified",
              phone: "Not specified",
            },
            { onConflict: "id" }
          )
          .select("id, name, email, role, ward")
          .single();

        if (createError || !createdProfile) {
          return res.status(401).json({ message: "User profile not found" });
        }

        effectiveProfile = createdProfile;
      }

      req.user = {
        ...effectiveProfile,
        role: normalizeRole(effectiveProfile.role),
        _id: effectiveProfile.id,
        authUser: user,
      };
      return next();
    }

    // Fallback for legacy JWTs used by admin and ward-admin login routes.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const profile = await getProfileById(decoded.id);

    req.user = {
      ...profile,
      role: normalizeRole(profile.role),
      _id: profile.id,
      authUser: null,
    };
    return next();
  } catch (error) {
    res.status(401).json({ message: "Token failed or expired" });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    const allowed = roles.map(normalizeRole);
    if (!allowed.includes(normalizeRole(req.user.role))) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
