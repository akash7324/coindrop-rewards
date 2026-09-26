import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function StatusBadge({ status }) {
  const cls =
    status === "Approved" ? "badge-approved" : status === "Rejected" ? "badge-rejected" : "badge-pending";
  return <span className={`badge ${cls}`}>{status}</span>;
}

// Screenshot paths returned by the API are server-relative ("/uploads/...").
// Build an absolute URL using the API's origin so <img> can load it.
function resolveUploadUrl(path) {
  if (!path) return null;
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/api\/?$/, "");
  return `${apiBase}${path}`;
}

// Shown once an admin has Approved the transaction AND attached a real
// Google Play code (see Admin Panel → Redemptions → Approve).
function RedeemCodeBox({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail on insecure/non-HTTPS origins — fail silently,
      // the code is still visible on screen to copy manually.
    }
  };

  return (
    <div className="redeem-code-box">
      <div>
        <div className="redeem-code-label">Your Google Play Code</div>
        <div className="redeem-code-value">{code}</div>
      </div>
      <button type="button" className="btn btn-outline btn-mini" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

export default function History() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await api.get("/users/history");
      setData(res.data);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="page-content">
      <div className="card">
        <p className="card-title">Profile</p>
        <p style={{ fontWeight: 700, fontSize: 16, margin: "4px 0" }}>{user?.name}</p>
        <p className="muted small">{user?.email}</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="stat-box">
          <div className="stat-num">{loading ? "…" : data?.completedAdViews ?? 0}</div>
          <div className="stat-label">Completed Tasks</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{user?.pointsBalance ?? 0}</div>
          <div className="stat-label">Current Points</div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">Transaction Status Log</p>
        {loading && <p className="muted small">Loading…</p>}
        {!loading && data?.transactions?.length === 0 && (
          <p className="muted small">No redemption requests yet.</p>
        )}
        {!loading &&
          data?.transactions?.map((tx) => (
            <div className="history-row" key={tx._id}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  ₹{tx.cashValueINR} Google Play Code
                </div>
                <div className="history-meta">
                  -{tx.pointsDeducted} pts · {new Date(tx.createdAt).toLocaleString()}
                </div>
                <div className="history-meta">To: {tx.redeemEmail}</div>

                {tx.status === "Approved" && tx.redeemCode && (
                  <RedeemCodeBox code={tx.redeemCode} />
                )}
                {tx.status === "Approved" && !tx.redeemCode && (
                  <p className="small muted" style={{ marginTop: 6 }}>
                    Approved — your code will appear here shortly.
                  </p>
                )}
                {tx.status === "Rejected" && (
                  <p className="small muted" style={{ marginTop: 6 }}>
                    Rejected — {tx.pointsDeducted} points were refunded to your balance.
                  </p>
                )}

                {tx.screenshotUrl && (
                  <img
                    src={resolveUploadUrl(tx.screenshotUrl)}
                    alt="Redemption proof"
                    className="screenshot-thumb"
                    style={{ maxWidth: 140 }}
                    onClick={() => setLightboxSrc(resolveUploadUrl(tx.screenshotUrl))}
                  />
                )}
              </div>
              <StatusBadge status={tx.status} />
            </div>
          ))}
      </div>

      {lightboxSrc && (
        <div className="lightbox-overlay" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="Screenshot full view" />
        </div>
      )}
    </div>
  );
}
