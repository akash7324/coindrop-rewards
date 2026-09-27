const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["redeem_google_play"],
      default: "redeem_google_play",
    },
    pointsDeducted: {
      type: Number,
      required: true,
      min: 0,
    },
    cashValueINR: {
      type: Number,
      required: true,
      min: 0,
    },
    // Details the user supplies to receive their code (email to send code to)
    redeemEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    // Optional proof screenshot (e.g. payment app / account screenshot)
    // the user can attach to help admins verify + approve faster.
    screenshotUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    // Filled in only by an admin/back-office process once a real
    // Google Play code has been manually issued.
    redeemCode: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
