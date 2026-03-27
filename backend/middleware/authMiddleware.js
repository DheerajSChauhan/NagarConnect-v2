const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

// Protect routes
exports.protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, role, ward")
      .eq("id", decoded.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ message: "Token failed or expired" });
    }

    req.user = {
      ...user,
      _id: user.id,
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
