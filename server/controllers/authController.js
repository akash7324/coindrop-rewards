const { validationResult } = require("express-validator");
const User = require("../models/User");
const generateTokenAndSetCookie = require("../utils/generateToken");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

// @route  POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const user = await User.create({ name, email, password });

    generateTokenAndSetCookie(res, user._id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select(
      "+password +failedLoginAttempts +lockUntil"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.isLocked()) {
      const minsLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked due to failed attempts. Try again in ${minsLeft} minute(s).`,
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated.",
      });
    }

    // reset lockout counters on success
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    generateTokenAndSetCookie(res, user._id);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/auth/logout
const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return res.status(200).json({ success: true, message: "Logged out." });
};

// @route  GET /api/auth/me
const getMe = async (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
};

module.exports = { signup, login, logout, getMe };
