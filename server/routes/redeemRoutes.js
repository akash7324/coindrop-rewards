const express = require("express");
const { body } = require("express-validator");
const { createRedemption, checkEligibility } = require("../controllers/redeemController");
const { protect } = require("../middleware/authMiddleware");
const { uploadScreenshot } = require("../middleware/uploadMiddleware");

const router = express.Router();

const redeemValidation = [
  body("redeemEmail").isEmail().normalizeEmail().withMessage("A valid email to receive your code is required."),
  body("notes").optional().trim().isLength({ max: 300 }),
];

router.use(protect);
router.get("/eligibility", checkEligibility);
// uploadScreenshot.single("screenshot") parses the multipart form and
// populates req.file (optional) + req.body before validation/controller run.
router.post("/", uploadScreenshot.single("screenshot"), redeemValidation, createRedemption);

module.exports = router;
