const crypto = require("crypto");
const AdView = require("../models/AdView");
const User = require("../models/User");

const MIN_WATCH_SECONDS = Number(process.env.AD_MIN_WATCH_SECONDS || 15);
const POINTS_PER_VIEW = Number(process.env.POINTS_PER_AD_VIEW || 40);
const DAILY_AD_LIMIT = Number(process.env.AD_DAILY_LIMIT || 40);
const COOLDOWN_SECONDS = Number(process.env.AD_COOLDOWN_SECONDS || 10);

// The ad-view cap resets on a ROLLING window, not literally "24 hours" —
// how long that window is (in hours) is configurable via .env.
const LIMIT_WINDOW_HOURS = Number(process.env.AD_LIMIT_WINDOW_HOURS || 12);
const LIMIT_WINDOW_MS = LIMIT_WINDOW_HOURS * 60 * 60 * 1000;

// Counts how many ads this user has COMPLETED within the trailing
// LIMIT_WINDOW_HOURS (a rolling window, not "since midnight") — used
// both to enforce the cap and to report remaining views to the client.
const countAdsWatchedInWindow = async (userId) => {
  const since = new Date(Date.now() - LIMIT_WINDOW_MS);
  return AdView.countDocuments({
    user: userId,
    status: "completed",
    completedAt: { $gte: since },
  });
};

// @route  POST /api/ads/start
// Creates a server-tracked session the instant the user presses "Watch".
// Enforces two anti-fraud guards BEFORE a session is ever created:
//   1. Rolling-window cap — max DAILY_AD_LIMIT completed views per
//      LIMIT_WINDOW_HOURS (currently 12h).
//   2. Cooldown — at least COOLDOWN_SECONDS must have passed since the
//      user's last ad session was started, so rapid/bot clicking of
//      "Watch" cannot spin up back-to-back sessions even by calling the
//      API directly (the frontend button cooldown is UX only — this is
//      the real, unbypassable enforcement).
const startAdView = async (req, res, next) => {
  try {
    const watchedInWindow = await countAdsWatchedInWindow(req.user._id);
    if (watchedInWindow >= DAILY_AD_LIMIT) {
      return res.status(429).json({
        success: false,
        message: `Limit reached. You can watch up to ${DAILY_AD_LIMIT} ads every ${LIMIT_WINDOW_HOURS} hours — please come back later.`,
        watchedToday: watchedInWindow,
        dailyLimit: DAILY_AD_LIMIT,
        limitWindowHours: LIMIT_WINDOW_HOURS,
      });
    }

    const lastSession = await AdView.findOne({ user: req.user._id }).sort({ startedAt: -1 });
    if (lastSession) {
      const secondsSinceLast = (Date.now() - new Date(lastSession.startedAt).getTime()) / 1000;
      if (secondsSinceLast < COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(COOLDOWN_SECONDS - secondsSinceLast);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSeconds}s before watching another ad.`,
          cooldownSeconds: waitSeconds,
        });
      }
    }

    const sessionToken = crypto.randomBytes(24).toString("hex");

    const adView = await AdView.create({
      user: req.user._id,
      adType: "premium_video",
      status: "started",
      startedAt: new Date(),
      sessionToken,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      sessionToken: adView.sessionToken,
      minWatchSeconds: MIN_WATCH_SECONDS,
      cooldownSeconds: COOLDOWN_SECONDS,
      watchedToday: watchedInWindow, // count BEFORE this session — completeAdView reports the updated count
      dailyLimit: DAILY_AD_LIMIT,
      limitWindowHours: LIMIT_WINDOW_HOURS,
      message: "Ad session started. Countdown must complete before reward.",
    });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/ads/complete
// Body: { sessionToken }
// Server re-verifies elapsed time server-side — the client-visible
// countdown is UX only and is NOT trusted for awarding points. Also
// re-checks the rolling-window cap in case the user hit it via a
// concurrent session started just before this one completed.
const completeAdView = async (req, res, next) => {
  try {
    const { sessionToken } = req.body;
    if (!sessionToken) {
      return res
        .status(400)
        .json({ success: false, message: "Missing sessionToken." });
    }

    const adView = await AdView.findOne({
      sessionToken,
      user: req.user._id,
    });

    if (!adView) {
      return res
        .status(404)
        .json({ success: false, message: "Ad session not found." });
    }

    if (adView.status !== "started") {
      return res.status(409).json({
        success: false,
        message: "This ad session has already been finalized.",
      });
    }

    const watchedInWindow = await countAdsWatchedInWindow(req.user._id);
    if (watchedInWindow >= DAILY_AD_LIMIT) {
      adView.status = "rejected";
      await adView.save();
      return res.status(429).json({
        success: false,
        message: `Limit reached. You can watch up to ${DAILY_AD_LIMIT} ads every ${LIMIT_WINDOW_HOURS} hours — please come back later.`,
        watchedToday: watchedInWindow,
        dailyLimit: DAILY_AD_LIMIT,
        limitWindowHours: LIMIT_WINDOW_HOURS,
      });
    }

    const elapsedMs = Date.now() - new Date(adView.startedAt).getTime();
    const elapsedSeconds = elapsedMs / 1000;

    // Hard server-side floor: reject if the required watch time
    // genuinely has not passed yet.
    if (elapsedSeconds < MIN_WATCH_SECONDS) {
      adView.status = "rejected";
      await adView.save();
      return res.status(400).json({
        success: false,
        message: `Ad must be watched for at least ${MIN_WATCH_SECONDS} seconds.`,
      });
    }

    // Also reject stale sessions left open too long (> 10 minutes),
    // to prevent someone starting a session and replaying it hours later.
    if (elapsedSeconds > 600) {
      adView.status = "expired";
      await adView.save();
      return res.status(410).json({
        success: false,
        message: "Ad session expired. Please start a new ad view.",
      });
    }

    adView.status = "completed";
    adView.completedAt = new Date();
    adView.pointsAwarded = POINTS_PER_VIEW;
    await adView.save();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          pointsBalance: POINTS_PER_VIEW,
          totalAdsWatched: 1,
          totalPointsEarned: POINTS_PER_VIEW,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `+${POINTS_PER_VIEW} points credited!`,
      pointsAwarded: POINTS_PER_VIEW,
      pointsBalance: user.pointsBalance,
      totalAdsWatched: user.totalAdsWatched,
      watchedToday: watchedInWindow + 1,
      dailyLimit: DAILY_AD_LIMIT,
      limitWindowHours: LIMIT_WINDOW_HOURS,
      cooldownSeconds: COOLDOWN_SECONDS,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { startAdView, completeAdView };
