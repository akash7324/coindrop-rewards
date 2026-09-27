const express = require("express");
const { body } = require("express-validator");
const {
  getOverview,
  listUsers,
  toggleUserActive,
  listTransactions,
  updateTransactionStatus,
} = require("../controllers/adminController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Every route below requires a logged-in user AND role === "admin"
router.use(protect, requireAdmin);

router.get("/overview", getOverview);

router.get("/users", listUsers);
router.patch("/users/:id/toggle-active", toggleUserActive);

router.get("/transactions", listTransactions);
router.patch(
  "/transactions/:id",
  [
    body("status").isIn(["Approved", "Rejected"]),
    body("redeemCode").optional().trim().isLength({ max: 60 }),
  ],
  updateTransactionStatus
);

module.exports = router;
