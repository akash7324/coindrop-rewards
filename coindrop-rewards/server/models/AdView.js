const mongoose = require("mongoose");

/**
 * Every "watch ad" attempt is a server-tracked session.
 * 1. Client calls /api/ads/start  -> a doc is created with status "started" + startedAt.
 * 2. Client waits out the 15s countdown locally (UX only).
 * 3. Client calls /api/ads/complete -> server RE-VERIFIES that
 *    Date.now() - startedAt >= AD_MIN_WATCH_SECONDS before awarding points.
 * This prevents users from forging a "completed" call without the
 * server-side elapsed time actually having passed.
 */
const AdViewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    adType: {
      type: String,
      enum: ["premium_video"],
      default: "premium_video",
    },
    status: {
      type: String,
      enum: ["started", "completed", "expired", "rejected"],
      default: "started",
      index: true,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // simple per-session token to prevent replaying the same start event twice
    sessionToken: {
      type: String,
      required: true,
      unique: true,
    },
    ipAddress: String,
  },
  { timestamps: true }
);

// Speeds up the rolling-24h daily-limit count and the
// "most recent session" cooldown lookup in adController.js
AdViewSchema.index({ user: 1, status: 1, completedAt: -1 });
AdViewSchema.index({ user: 1, startedAt: -1 });

module.exports = mongoose.model("AdView", AdViewSchema);
