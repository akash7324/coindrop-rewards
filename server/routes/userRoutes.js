const express = require("express");
const { getDashboard, getHistory } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/dashboard", getDashboard);
router.get("/history", getHistory);

module.exports = router;
