import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export function TopBar() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="topbar">
      <div className="topbar-brand">
        Coin<span>Drop</span> Rewards
      </div>
      <div className="topbar-actions">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label="Toggle dark / light mode"
          title="Toggle dark / light mode"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <button className="logout-link" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
  );
}

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
        <span className="nav-icon">🎬</span>
        Earn
      </NavLink>
      <NavLink to="/redeem" className={({ isActive }) => (isActive ? "active" : "")}>
        <span className="nav-icon">🎁</span>
        Redeem
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => (isActive ? "active" : "")}>
        <span className="nav-icon">📜</span>
        History
      </NavLink>
    </nav>
  );
}
