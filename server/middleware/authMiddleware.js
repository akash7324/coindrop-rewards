const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Reads the JWT from the secure httpOnly cookie (preferred) or the
 * Authorization: Bearer header (fallback for API clients), verifies it,
 * and attaches the fresh user document (minus password) to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please log in.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account not found or has been deactivated.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Session invalid or expired. Please log in again.",
    });
  }
};

// Optional role guard, e.g. protect + admin-only routes
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ success: false, message: "Admins only." });
};

module.exports = { protect, requireAdmin };
