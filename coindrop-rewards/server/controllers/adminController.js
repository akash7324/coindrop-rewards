const User = require("../models/User");
const Transaction = require("../models/Transaction");
const AdView = require("../models/AdView");

// @route  GET /api/admin/overview
const getOverview = async (req, res, next) => {
  try {
    const [totalUsers, totalPending, totalApproved, pointsAgg, adsWatched] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments({ status: "Pending" }),
      Transaction.countDocuments({ status: "Approved" }),
      User.aggregate([{ $group: { _id: null, total: { $sum: "$pointsBalance" } } }]),
      AdView.countDocuments({ status: "completed" }),
    ]);

    return res.status(200).json({
      success: true,
      totalUsers,
      totalPending,
      totalApproved,
      totalPointsInCirculation: pointsAgg[0]?.total || 0,
      totalAdsWatched: adsWatched,
    });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/admin/users
const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(200);
    return res.status(200).json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

// @route  PATCH /api/admin/users/:id/toggle-active
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    user.isActive = !user.isActive;
    await user.save();
    return res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/admin/transactions?status=Pending
const listTransactions = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status && ["Pending", "Approved", "Rejected"].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    const transactions = await Transaction.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(300);
    return res.status(200).json({ success: true, transactions });
  } catch (err) {
    next(err);
  }
};

// @route  PATCH /api/admin/transactions/:id
// Body: { status: "Approved" | "Rejected", redeemCode? }
// Approving a transaction just marks status + optional real code —
// points were already deducted atomically at request time, so approving
// does not touch the balance again. Rejecting REFUNDS the points.
const updateTransactionStatus = async (req, res, next) => {
  try {
    const { status, redeemCode } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }
    if (transaction.status !== "Pending") {
      return res.status(409).json({
        success: false,
        message: `This transaction was already ${transaction.status}.`,
      });
    }

    transaction.status = status;
    transaction.processedAt = new Date();
    transaction.processedBy = req.user._id;
    if (status === "Approved" && redeemCode) {
      transaction.redeemCode = redeemCode;
    }
    await transaction.save();

    // Refund points back to the user if the redemption is rejected
    if (status === "Rejected") {
      await User.findByIdAndUpdate(transaction.user, {
        $inc: { pointsBalance: transaction.pointsDeducted },
      });
    }

    return res.status(200).json({ success: true, transaction });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverview,
  listUsers,
  toggleUserActive,
  listTransactions,
  updateTransactionStatus,
};
