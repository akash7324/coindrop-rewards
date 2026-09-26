import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import VideoAdModal from "../components/VideoAdModal";
import { ADSTERRA_SMARTLINK_URL, isSmartlinkConfigured } from "../config/ads";

const DEFAULT_COOLDOWN_SECONDS = 10;
const DEFAULT_DAILY_LIMIT = 40;
const DEFAULT_WINDOW_HOURS = 12;

export default function Dashboard() {
  const { refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdModal, setShowAdModal] = useState(false);

  // Anti-fraud button cooldown: counts down from adCooldownSeconds (10s
  // by default) the instant an ad session is initiated. The server
  // enforces the same cooldown independently in /api/ads/start — this
  // is just the UI reflection of it, so bot-clicking never even reaches
  // the network before the button visibly locks.
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownIntervalRef = useRef(null);

  const loadStats = async () => {
    setLoading(true);
    const { data } = await api.get("/users/dashboard");
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
    return () => clearInterval(cooldownIntervalRef.current);
  }, []);

  const handleRewardGranted = async () => {
    await loadStats();
    await refreshUser();
  };

  const startCooldown = (seconds) => {
    clearInterval(cooldownIntervalRef.current);
    setCooldownRemaining(seconds);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Fires the instant the user taps "Watch". Opening window.open() here,
  // synchronously inside the click handler (not after an await), is what
  // stops browser popup-blockers from swallowing the Smartlink tab.
  const handleWatchClick = () => {
    if (dailyLimitReached || cooldownRemaining > 0) return;

    if (isSmartlinkConfigured()) {
      window.open(ADSTERRA_SMARTLINK_URL, "_blank", "noopener,noreferrer");
    }
    startCooldown(stats?.adCooldownSeconds || DEFAULT_COOLDOWN_SECONDS);
    setShowAdModal(true);
  };

  const watchedToday = stats?.watchedToday ?? 0;
  const dailyLimit = stats?.dailyAdLimit ?? DEFAULT_DAILY_LIMIT;
  const limitWindowHours = stats?.limitWindowHours ?? DEFAULT_WINDOW_HOURS;
  const dailyLimitReached = watchedToday >= dailyLimit;
  const redeemThreshold = stats?.redeemThreshold ?? 25000;
  const redeemCashValueINR = stats?.redeemCashValueINR ?? 50;
  const estimatedValue = stats
    ? ((stats.pointsBalance / redeemThreshold) * redeemCashValueINR).toFixed(2)
    : "…";

  let watchBtnLabel = "Watch";
  if (dailyLimitReached) watchBtnLabel = "Limit Reached";
  else if (cooldownRemaining > 0) watchBtnLabel = `Wait ${cooldownRemaining}s`;

  return (
    <div className="page-content">
      <div className="card balance-hero center-text">
        <p className="card-title">Your Balance</p>
        <p className="balance-amount">{loading ? "…" : stats?.pointsBalance ?? 0} pts</p>
        <p className="muted small">≈ ₹{estimatedValue} at redemption rate</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="stat-box">
          <div className="stat-num">{loading ? "…" : stats?.totalAdsWatched ?? 0}</div>
          <div className="stat-label">Ads Watched</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">+{stats?.pointsPerAd ?? 40}</div>
          <div className="stat-label">Points / Ad</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p className="card-title" style={{ margin: 0 }}>
            Ad Limit ({limitWindowHours}h)
          </p>
          <span className={`small ${dailyLimitReached ? "error-text" : "muted"}`}>
            {loading ? "…" : `${watchedToday} / ${dailyLimit}`}
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${loading ? 0 : Math.min(100, (watchedToday / dailyLimit) * 100)}%` }}
          />
        </div>
        {dailyLimitReached && (
          <p className="small error-text" style={{ marginTop: 4 }}>
            You've hit the limit — more ads unlock in the next {limitWindowHours}-hour window.
          </p>
        )}
      </div>

      <p className="card-title" style={{ marginLeft: 4 }}>
        Earning Tasks
      </p>

      <div className="card">
        <div className="task-row">
          <div className="task-info">
            <div className="task-icon">🎬</div>
            <div>
              <div className="task-name">Premium Video Ad</div>
              <div className="task-reward">+{stats?.pointsPerAd ?? 40} points · ~15 sec</div>
            </div>
          </div>
          <button
            className="task-claim-btn"
            onClick={handleWatchClick}
            disabled={dailyLimitReached || cooldownRemaining > 0}
          >
            {watchBtnLabel}
          </button>
        </div>
      </div>

      <p className="muted small center-text" style={{ marginTop: 18 }}>
        Only Premium Video Ads are available for earning. No app downloads, surveys, or check-ins — ever.
      </p>

      {showAdModal && (
        <VideoAdModal
          minSeconds={15}
          onRewardGranted={handleRewardGranted}
          onClose={() => setShowAdModal(false)}
        />
      )}
    </div>
  );
}
