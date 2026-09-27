const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const REDEEM_THRESHOLD = Number(process.env.REDEEM_POINTS_THRESHOLD || 25000);
const CASH_VALUE_INR = Number(process.env.REDEEM_CASH_VALUE_INR || 50);

// @route  POST /api/redeem
// Body: { redeemEmail, notes? }
// Strictly verifies balance >= threshold server-side before deducting
// points and logging a Pending transaction. Uses a transaction-safe
// atomic update so a user cannot double-spend via concurrent requests.
const createRedemption = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { redeemEmail, notes } = req.body;

    // req.file is populated by the uploadScreenshot (multer) middleware
    // when the user attaches an optional proof screenshot.
    const screenshotUrl = req.file ? `/uploads/screenshots/${req.file.filename}` : null;

    // Atomic conditional decrement: only succeeds if pointsBalance
    // is still >= REDEEM_THRESHOLD at the moment of the update.
    // This closes the race condition where two simultaneous redeem
    // requests could both pass a naive "if balance >= threshold" check.
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        pointsBalance: { $gte: REDEEM_THRESHOLD },
      },
      { $inc: { pointsBalance: -REDEEM_THRESHOLD } },
      { new: true }
    );

    if (!updatedUser) {
      const current = await User.findById(req.user._id);
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You need ${REDEEM_THRESHOLD} points to redeem, you have ${current.pointsBalance}.`,
      });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type: "redeem_google_play",
      pointsDeducted: REDEEM_THRESHOLD,
      cashValueINR: CASH_VALUE_INR,
      redeemEmail,
      notes,
      screenshotUrl,
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message:
        "Redemption request submitted! Your Google Play code will be sent to your email once approved.",
      transaction,
      pointsBalance: updatedUser.pointsBalance,
    });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/redeem/eligibility
const checkEligibility = async (req, res) => {
  const eligible = req.user.pointsBalance >= REDEEM_THRESHOLD;
  return res.status(200).json({
    success: true,
    eligible,
    pointsBalance: req.user.pointsBalance,
    pointsNeeded: eligible ? 0 : REDEEM_THRESHOLD - req.user.pointsBalance,
    threshold: REDEEM_THRESHOLD,
    cashValueINR: CASH_VALUE_INR,
  });
};

module.exports = { createRedemption, checkEligibility };
