import { useEffect } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import FileComplaint from "./pages/FileComplaint";
import MyComplaints from "./pages/MyComplaints";
import MapPage from "./pages/MapPage";
import Forum from "./pages/Forum";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import OfficerDashboard from "./pages/WardDashboard";
import Leaderboard from "./pages/WardLeaderboard";
import LoginModal from "./components/LoginModal";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";

const RouteController = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openAuthModal } = useAuth();

  useEffect(() => {
    if (location.pathname === "/login") {
      openAuthModal("login");
      navigate("/", { replace: true });
    }
    if (location.pathname === "/signup") {
      openAuthModal("signup");
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate, openAuthModal]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/file-complaint" element={<FileComplaint />} />
        <Route path="/my-complaints" element={<MyComplaints />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/leaderboard" element={<Leaderboard />} />

        <Route
          path="/admin"
          element={(
            <ProtectedRoute role={["admin", "super_admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/officer-dashboard"
          element={(
            <ProtectedRoute role={["city_officer", "district_officer", "state_officer", "dept_admin", "super_admin"]}>
              <OfficerDashboard />
            </ProtectedRoute>
          )}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <LoginModal />
    </>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            <RouteController />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
