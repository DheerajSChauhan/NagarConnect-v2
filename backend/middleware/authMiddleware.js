const supabase = require("../config/supabase");
const supabaseClient = require("../config/supabaseClient");

// Protect routes
exports.protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    // Verify Supabase token
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ message: "Token failed or expired" });
    }

    // Fetch user profile from database
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
      _id: effectiveProfile.id,
      authUser: user,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: "Token failed or expired" });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
