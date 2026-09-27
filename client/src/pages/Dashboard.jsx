import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import VideoAdModal from "../components/VideoAdModal";
import { isSmartlinkConfigured } from "../config/ads";

const DEFAULT_COOLDOWN_SECONDS = 10;
const DEFAULT_DAILY_LIMIT = 40;
const DEFAULT_WINDOW_HOURS = 12;

export default function Dashboard() {
  const { refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdModal, setShowAdModal] = useState(false);

  // Anti-fraud button cooldown tracking
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownIntervalRef = useRef(null);

  // Load backend stats
  const loadStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users/dashboard");
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    return () => clearInterval(cooldownIntervalRef.current);
  }, []);

  // Cooldown timer starter
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

  // 1. Asli function jo points badhane par website data refresh karega
  const handleRewardGranted = async () => {
    try {
      // Backend ko ad complete hone ka signal bhejein taaki points milein
      await api.post("/ads/complete"); 
      await loadStats();
      await refreshUser();
    } catch (error) {
      console.error("Error granting reward:", error);
    }
  };

  // 2. Click handle function - Jo Ad load karega aur timer chalu karega
  const handleWatchClick = () => {
    if (dailyLimitReached || cooldownRemaining > 0) return;

    // Aapka Monetag Direct Link naye tab me open hoga
    window.open("https://omg10.com/4/11886573", "_blank", "noopener,noreferrer");
    
    // UI Cooldown aur Modal show hoga
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
