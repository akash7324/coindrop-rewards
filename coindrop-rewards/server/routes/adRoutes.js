const express = require("express");
const rateLimit = require("express-rate-limit");
const { startAdView, completeAdView } = require("../controllers/adController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Prevent hammering the ad-start endpoint to farm sessions
const adLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, message: "Too many ad requests. Slow down." },
});

router.use(protect);
router.post("/start", adLimiter, startAdView);
router.post("/complete", adLimiter, completeAdView);

module.exports = router;
