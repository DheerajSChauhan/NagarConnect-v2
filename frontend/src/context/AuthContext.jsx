import PropTypes from 'prop-types';
import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const ADMIN_SECRET = "NAGAR-ADMIN-2026";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");

  const openAuthModal = useCallback((tab = "login") => {
    setAuthTab(tab);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  const login = useCallback((payload) => {
    const role = payload.role || "citizen";
    const profile = {
      id: payload.id || `u-${Date.now()}`,
      name: payload.name || "Citizen User",
      email: payload.email,
      state: payload.state || "",
      district: payload.district || "",
      city: payload.city || "",
      locality: payload.locality || "",
      department: payload.department || "",
      employeeId: payload.employeeId || "",
      role,
      avatar: payload.name ? payload.name.charAt(0).toUpperCase() : "N",
    };
    const nextToken = `demo-jwt-${Date.now()}`;
    localStorage.setItem("user", JSON.stringify(profile));
    localStorage.setItem("token", nextToken);
    setUser(profile);
    setToken(nextToken);
    setAuthModalOpen(false);
    return profile;
  }, []);

  const signup = useCallback((payload) => {
    if (payload.role === "super_admin" && payload.secretKey !== ADMIN_SECRET) {
      throw new Error("Invalid admin secret key");
    }
    return login(payload);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isAdmin: ["admin", "super_admin"].includes(user?.role),
      isCityOfficer: user?.role === "city_officer",
      authModalOpen,
      authTab,
      setAuthTab,
      openAuthModal,
      closeAuthModal,
      login,
      signup,
      logout,
    }),
    [authModalOpen, authTab, closeAuthModal, login, logout, openAuthModal, signup, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
