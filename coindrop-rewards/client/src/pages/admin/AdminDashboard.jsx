import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

function resolveUploadUrl(path) {
  if (!path) return null;
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/api\/?$/, "");
  return `${apiBase}${path}`;
}

function StatusBadge({ status }) {
  const cls =
    status === "Approved" ? "badge-approved" : status === "Rejected" ? "badge-rejected" : "badge-pending";
  return <span className={`badge ${cls}`}>{status}</span>;
}

function OverviewTab({ overview }) {
  if (!overview) return <p className="muted small" style={{ padding: "0 16px" }}>Loading…</p>;
  const stats = [
    { label: "Total Users", value: overview.totalUsers },
    { label: "Pending Redemptions", value: overview.totalPending },
    { label: "Approved Redemptions", value: overview.totalApproved },
    { label: "Points In Circulation", value: overview.totalPointsInCirculation },
    { label: "Ads Watched", value: overview.totalAdsWatched },
  ];
  return (
    <div className="admin-stats-grid">
      {stats.map((s) => (
        <div className="stat-box" key={s.label}>
          <div className="stat-num">{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function TransactionsTab({ transactions, onAction, lightboxSrc, setLightboxSrc }) {
  const [codeInputs, setCodeInputs] = useState({});

  const handleApprove = (tx) => {
    onAction(tx._id, "Approved", codeInputs[tx._id] || "");
  };

  return (
    <div className="admin-table-wrap">
      {transactions.length === 0 && <p className="muted small">No transactions found.</p>}
      {transactions.map((tx) => (
        <div className="admin-row" key={tx._id}>
          <div className="admin-row-top">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{tx.user?.name || "Unknown user"}</div>
              <div className="history-meta">{tx.user?.email}</div>
              <div className="history-meta">
                -{tx.pointsDeducted} pts · ₹{tx.cashValueINR} · {new Date(tx.createdAt).toLocaleString()}
              </div>
              <div className="history-meta">Send to: {tx.redeemEmail}</div>
              {tx.notes && <div className="history-meta">Notes: {tx.notes}</div>}
            </div>
            <StatusBadge status={tx.status} />
          </div>

          {tx.screenshotUrl && (
            <img
              src={resolveUploadUrl(tx.screenshotUrl)}
              alt="Proof screenshot"
              className="screenshot-thumb"
              style={{ maxWidth: 160 }}
              onClick={() => setLightboxSrc(resolveUploadUrl(tx.screenshotUrl))}
            />
          )}

          {tx.status === "Pending" && (
            <>
              <div className="form-group" style={{ marginTop: 10, marginBottom: 0 }}>
                <input
                  className="form-input"
                  placeholder="Google Play code (optional, for Approve)"
                  value={codeInputs[tx._id] || ""}
                  onChange={(e) => setCodeInputs({ ...codeInputs, [tx._id]: e.target.value })}
                />
              </div>
              <div className="admin-row-actions">
                <button className="btn btn-primary btn-mini" onClick={() => handleApprove(tx)}>
                  Approve
                </button>
                <button
                  className="btn btn-danger btn-mini"
                  onClick={() => onAction(tx._id, "Rejected")}
                >
                  Reject &amp; Refund
                </button>
              </div>
            </>
          )}

          {tx.status !== "Pending" && tx.redeemCode && (
            <p className="small muted" style={{ marginTop: 8 }}>
              Code issued: <strong>{tx.redeemCode}</strong>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function UsersTab({ users, onToggleActive }) {
  return (
    <div className="admin-table-wrap">
      {users.map((u) => (
        <div className="admin-row" key={u._id}>
          <div className="admin-row-top">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {u.name} {u.role === "admin" && <span className="badge badge-approved">ADMIN</span>}
              </div>
              <div className="history-meta">{u.email}</div>
              <div className="history-meta">
                {u.pointsBalance} pts · {u.totalAdsWatched} ads watched
              </div>
            </div>
            <span className={`badge ${u.isActive ? "badge-approved" : "badge-rejected"}`}>
              {u.isActive ? "Active" : "Disabled"}
            </span>
          </div>
          <div className="admin-row-actions">
            <button
              className={`btn btn-mini ${u.isActive ? "btn-danger" : "btn-outline"}`}
              onClick={() => onToggleActive(u._id)}
            >
              {u.isActive ? "Disable Account" : "Re-enable Account"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txFilter, setTxFilter] = useState("Pending");
  const [users, setUsers] = useState([]);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = async () => {
    const { data } = await api.get("/admin/overview");
    setOverview(data);
  };
  const loadTransactions = async (status) => {
    const { data } = await api.get(`/admin/transactions${status ? `?status=${status}` : ""}`);
    setTransactions(data.transactions);
  };
  const loadUsers = async () => {
    const { data } = await api.get("/admin/users");
    setUsers(data.users);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadOverview(), loadTransactions(txFilter), loadUsers()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "transactions") loadTransactions(txFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txFilter]);

  const handleTxAction = async (id, status, redeemCode) => {
    await api.patch(`/admin/transactions/${id}`, { status, redeemCode });
    await Promise.all([loadTransactions(txFilter), loadOverview()]);
  };

  const handleToggleActive = async (id) => {
    await api.patch(`/admin/users/${id}/toggle-active`);
    await loadUsers();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      <div className="topbar">
        <div className="topbar-brand">
          Admin<span> Panel</span>
        </div>
        <div className="topbar-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <span className="muted small">{user?.name}</span>
          <button className="logout-link" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${tab === "overview" ? "active" : ""}`}
          onClick={() => setTab("overview")}
        >
          Overview
        </button>
        <button
          className={`admin-tab-btn ${tab === "transactions" ? "active" : ""}`}
          onClick={() => setTab("transactions")}
        >
          Redemptions
        </button>
        <button
          className={`admin-tab-btn ${tab === "users" ? "active" : ""}`}
          onClick={() => setTab("users")}
        >
          Users
        </button>
      </div>

      {loading && <p className="muted small" style={{ padding: "0 16px" }}>Loading admin data…</p>}

      {!loading && tab === "overview" && <OverviewTab overview={overview} />}

      {!loading && tab === "transactions" && (
        <>
          <div className="admin-tabs" style={{ marginTop: 0 }}>
            {["Pending", "Approved", "Rejected", ""].map((s) => (
              <button
                key={s || "all"}
                className={`admin-tab-btn ${txFilter === s ? "active" : ""}`}
                onClick={() => setTxFilter(s)}
              >
                {s || "All"}
              </button>
            ))}
          </div>
          <TransactionsTab
            transactions={transactions}
            onAction={handleTxAction}
            lightboxSrc={lightboxSrc}
            setLightboxSrc={setLightboxSrc}
          />
        </>
      )}

      {!loading && tab === "users" && <UsersTab users={users} onToggleActive={handleToggleActive} />}

      {lightboxSrc && (
        <div className="lightbox-overlay" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="Screenshot full view" />
        </div>
      )}
    </div>
  );
}
