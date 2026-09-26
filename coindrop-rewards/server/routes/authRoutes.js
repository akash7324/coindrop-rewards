const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const { signup, login, logout, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Extra-strict limiter just for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many auth attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupValidation = [
  body("name").trim().isLength({ min: 2, max: 60 }).withMessage("Name must be 2-60 characters."),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .matches(/\d/)
    .withMessage("Password must contain at least one number."),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required."),
  body("password").notEmpty().withMessage("Password is required."),
];

router.post("/signup", authLimiter, signupValidation, signup);
router.post("/login", authLimiter, loginValidation, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

module.exports = router;
