import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Redeem() {
  const { refreshUser } = useAuth();
  const [elig, setElig] = useState(null);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const loadEligibility = async () => {
    const { data } = await api.get("/redeem/eligibility");
    setElig(data);
  };

  useEffect(() => {
    loadEligibility();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!elig?.eligible) {
      setError(`You need ${elig?.pointsNeeded ?? 0} more points to redeem.`);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("redeemEmail", email);
      formData.append("notes", notes);
      if (screenshot) formData.append("screenshot", screenshot);

      const { data } = await api.post("/redeem", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(data.message);
      setEmail("");
      setNotes("");
      clearFile();
      await loadEligibility();
      await refreshUser();
    } catch (err) {
      setError(err?.response?.data?.message || "Redemption failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const progressPct = elig ? Math.min(100, (elig.pointsBalance / elig.threshold) * 100) : 0;

  return (
    <div className="page-content">
      <div className="card">
        <p className="card-title">
          {elig ? `₹${elig.cashValueINR} Google Play Redeem Code` : "Google Play Redeem Code"}
        </p>
        <p className="muted small">
          {elig
            ? `Cash out ${elig.threshold.toLocaleString()} points for a real ₹${elig.cashValueINR} Google Play gift code, sent to your email once approved.`
            : "Loading redemption details…"}
        </p>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="small muted">
          {elig ? `${elig.pointsBalance} / ${elig.threshold} points` : "Loading…"}
        </p>
      </div>

      <div className="card">
        <p className="card-title">Redemption Details</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email to receive your code</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <input
              className="form-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything we should know?"
              maxLength={300}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Proof Screenshot (optional, speeds up approval)</label>
            {!screenshotPreview ? (
              <label className="upload-box">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                />
                <div style={{ fontSize: 22 }}>📸</div>
                <p className="small muted" style={{ margin: "6px 0 0 0" }}>
                  Tap to upload a screenshot (PNG/JPG/WEBP, max 5MB)
                </p>
              </label>
            ) : (
              <div>
                <img src={screenshotPreview} alt="Screenshot preview" className="upload-preview" />
                <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={clearFile}>
                  Remove screenshot
                </button>
              </div>
            )}
          </div>

          {error && <p className="error-text">{error}</p>}
          {success && <p className="success-text">{success}</p>}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting || !elig?.eligible}
            style={{ marginTop: 4 }}
          >
            {submitting
              ? "Submitting…"
              : elig?.eligible
              ? `Redeem ${elig.threshold.toLocaleString()} pts for ₹${elig.cashValueINR}`
              : `Need ${elig?.pointsNeeded ?? "…"} more pts`}
          </button>
        </form>
      </div>
    </div>
  );
}
