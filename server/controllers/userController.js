const User = require("../models/User");
const Transaction = require("../models/Transaction");
const AdView = require("../models/AdView");

const DAILY_AD_LIMIT = Number(process.env.AD_DAILY_LIMIT || 40);
const AD_COOLDOWN_SECONDS = Number(process.env.AD_COOLDOWN_SECONDS || 10);
const LIMIT_WINDOW_HOURS = Number(process.env.AD_LIMIT_WINDOW_HOURS || 12);
const LIMIT_WINDOW_MS = LIMIT_WINDOW_HOURS * 60 * 60 * 1000;

// @route  GET /api/users/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - LIMIT_WINDOW_MS);
    const [user, watchedToday] = await Promise.all([
      User.findById(req.user._id),
      AdView.countDocuments({
        user: req.user._id,
        status: "completed",
        completedAt: { $gte: since },
      }),
    ]);

    return res.status(200).json({
      success: true,
      pointsBalance: user.pointsBalance,
      totalAdsWatched: user.totalAdsWatched,
      totalPointsEarned: user.totalPointsEarned,
      pointsPerAd: Number(process.env.POINTS_PER_AD_VIEW || 40),
      redeemThreshold: Number(process.env.REDEEM_POINTS_THRESHOLD || 25000),
      redeemCashValueINR: Number(process.env.REDEEM_CASH_VALUE_INR || 50),
      // Rolling-window ad-watch usage, for the ad-limit UI indicator
      watchedToday,
      dailyAdLimit: DAILY_AD_LIMIT,
      limitWindowHours: LIMIT_WINDOW_HOURS,
      adsRemainingToday: Math.max(0, DAILY_AD_LIMIT - watchedToday),
      adCooldownSeconds: AD_COOLDOWN_SECONDS,
    });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/users/history
// Returns completed-task count + full transaction log (Pending/Approved/Rejected)
const getHistory = async (req, res, next) => {
  try {
    const [transactions, completedAdViews, totalAdViews] = await Promise.all([
      Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }),
      AdView.countDocuments({ user: req.user._id, status: "completed" }),
      AdView.countDocuments({ user: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      completedAdViews,
      totalAdViewAttempts: totalAdViews,
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getHistory };
