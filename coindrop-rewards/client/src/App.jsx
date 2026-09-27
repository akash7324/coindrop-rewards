import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Redeem from "./pages/Redeem";
import History from "./pages/History";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { TopBar, BottomNav } from "./components/Navbar";
import PopunderScript from "./components/PopunderScript";
import SocialBarScript from "./components/SocialBarScript";

function AuthedLayout({ children }) {
  return (
    <ProtectedRoute>
      <div className="app-shell">
        <TopBar />
        {children}
        <BottomNav />
        <SocialBarScript />
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <>
      {/* Mounted once, app-wide: injects the Adsterra popunder script */}
      <PopunderScript />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/dashboard"
          element={
            <AuthedLayout>
              <Dashboard />
            </AuthedLayout>
          }
        />
        <Route
          path="/redeem"
          element={
            <AuthedLayout>
              <Redeem />
            </AuthedLayout>
          }
        />
        <Route
          path="/history"
          element={
            <AuthedLayout>
              <History />
            </AuthedLayout>
          }
        />

        {/* Admin panel — requires role: "admin" (see server/utils/makeAdmin.js) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
