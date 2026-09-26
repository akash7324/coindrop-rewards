import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

/**
 * Flow:
 * 1. On mount, calls POST /api/ads/start -> server creates an AdView
 *    session and returns { sessionToken, minWatchSeconds }.
 * 2. Runs a local countdown for UX (purely visual).
 * 3. When countdown hits 0, calls POST /api/ads/complete with the
 *    sessionToken. The SERVER independently re-checks that enough
 *    real time has elapsed before crediting points — the client
 *    countdown is never trusted on its own.
 */
export default function VideoAdModal({ onClose, onRewardGranted, minSeconds = 15 }) {
  const [phase, setPhase] = useState("loading"); // loading | counting | verifying | done | error
  const [secondsLeft, setSecondsLeft] = useState(minSeconds);
  const [errorMsg, setErrorMsg] = useState("");
  const [reward, setReward] = useState(null);
  const sessionTokenRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    startSession();
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = async () => {
    try {
      const { data } = await api.post("/ads/start");
      sessionTokenRef.current = data.sessionToken;
      setSecondsLeft(data.minWatchSeconds || minSeconds);
      setPhase("counting");

      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setPhase("error");
      setErrorMsg(err?.response?.data?.message || "Could not start ad. Try again.");
    }
  };

  const completeSession = async () => {
    setPhase("verifying");
    try {
      const { data } = await api.post("/ads/complete", {
        sessionToken: sessionTokenRef.current,
      });
      setReward(data);
      setPhase("done");
      onRewardGranted && onRewardGranted(data);
    } catch (err) {
      setPhase("error");
      setErrorMsg(err?.response?.data?.message || "Verification failed. No points awarded.");
    }
  };

  return (
    <div className="modal-overlay" onClick={phase === "counting" ? undefined : onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {phase === "loading" && <p className="muted">Preparing your Premium Video Ad…</p>}

        {phase === "counting" && (
          <>
            <h3 style={{ margin: "0 0 4px 0" }}>Premium Video Ad</h3>
            <p className="muted small">Please watch until the timer finishes</p>
            <div className="timer-ring">
              <span>{secondsLeft}</span>
            </div>
            <p className="muted small">Do not close this window — points are only credited after full verification.</p>
          </>
        )}

        {phase === "verifying" && (
          <>
            <div className="timer-ring">
              <span>✓</span>
            </div>
            <p className="muted">Verifying your view with the server…</p>
          </>
        )}

        {phase === "done" && reward && (
          <>
            <h3 style={{ color: "var(--accent)", margin: "6px 0" }}>+{reward.pointsAwarded} Points!</h3>
            <p className="muted small">New balance: {reward.pointsBalance} pts</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onClose}>
              Awesome, close
            </button>
          </>
        )}

        {phase === "error" && (
          <>
            <p className="error-text">{errorMsg}</p>
            <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={onClose}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
