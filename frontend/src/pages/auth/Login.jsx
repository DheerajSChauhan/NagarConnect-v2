"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaHashtag } from "react-icons/fa";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    wardNumber: "",
    loginType: "user",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const showGoogleLogin = Boolean(googleClientId && googleClientId !== "YOUR_CLIENT_ID");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const toggleLoginType = (type) => {
    setCredentials({
      username: "",
      password: "",
      wardNumber: "",
      loginType: type,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let response;

      if (credentials.loginType === "admin") {
        response = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
          }),
        });
      } else if (credentials.loginType === "wardAdmin") {
        response = await fetch(`${API_BASE_URL}/api/auth/wardadmin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
            wardNumber: String(credentials.wardNumber),
          }),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.username,
            password: credentials.password,
          }),
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success(`Welcome back, ${data.user.name || "User"}!`);

      if (data.user.role === "admin") navigate("/dashboard");
      else if (data.user.role === "wardAdmin") navigate("/ward-dashboard");
      else navigate("/home");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: credentialResponse.credential }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Google login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success(`Welcome, ${data.user.name || "User"}!`);
      navigate("/home");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google authentication failed. Please try again.");
    toast.error("Google authentication failed");
  };

  const getLoginHeading = () => {
    if (credentials.loginType === "admin") return "Main Admin Login";
    if (credentials.loginType === "wardAdmin") return "Ward Admin Login";
    return "User Login";
  };

  const getLoginSubtitle = () => {
    if (credentials.loginType === "admin") return "Restricted Area";
    if (credentials.loginType === "wardAdmin") return "Manage complaints in your ward";
    return "Welcome back to NagarSaathi";
  };

  const loginColor =
    credentials.loginType === "admin"
      ? "bg-red-600"
      : credentials.loginType === "wardAdmin"
      ? "bg-green-600"
      : "bg-indigo-600";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-md transition-all">
        <div className={`py-6 px-8 text-center ${loginColor}`}>
          <h1 className="text-3xl font-bold text-white">{getLoginHeading()}</h1>
          <p className="text-indigo-100 mt-1 text-sm">{getLoginSubtitle()}</p>
        </div>

        <div className="p-8">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 mb-1">
                {credentials.loginType === "user" ? "Email" : "Username"}
              </label>
              <div className="relative">
                <FaUser className="absolute top-3 left-3 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-indigo-500"
                  placeholder={credentials.loginType === "user" ? "Your email" : "Enter username"}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Password</label>
              <div className="relative">
                <FaLock className="absolute top-3 left-3 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-indigo-500"
                  placeholder="Your password"
                  required
                />
              </div>
            </div>

            {credentials.loginType === "wardAdmin" && (
              <div>
                <label className="block text-gray-700 mb-1">Ward Number</label>
                <div className="relative">
                  <FaHashtag className="absolute top-3 left-3 text-gray-400" />
                  <input
                    type="text"
                    name="wardNumber"
                    value={credentials.wardNumber}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-green-500"
                    placeholder="Enter your ward number"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition duration-200 ${
                loading
                  ? "bg-gray-400"
                  : credentials.loginType === "admin"
                  ? "bg-red-600 hover:bg-red-700"
                  : credentials.loginType === "wardAdmin"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading
                ? "Authenticating..."
                : `Login as ${
                    credentials.loginType === "user"
                      ? "User"
                      : credentials.loginType === "admin"
                      ? "Admin"
                      : "Ward Admin"
                  }`}
            </button>
          </form>

          {credentials.loginType === "user" && showGoogleLogin && (
            <div className="my-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <GoogleOAuthProvider clientId={googleClientId}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    shape="pill"
                    width={300}
                    text="continue_with"
                    size="large"
                  />
                </GoogleOAuthProvider>
              </div>
            </div>
          )}

          <div className="mt-6 text-center space-y-2">
            {credentials.loginType !== "user" && (
              <button
                onClick={() => toggleLoginType("user")}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ← Login as Regular User
              </button>
            )}
            {credentials.loginType !== "admin" && (
              <button
                onClick={() => toggleLoginType("admin")}
                className="text-red-600 hover:text-red-800 font-medium block"
              >
                Login as Main Admin →
              </button>
            )}
            {credentials.loginType !== "wardAdmin" && (
              <button
                onClick={() => toggleLoginType("wardAdmin")}
                className="text-green-600 hover:text-green-800 font-medium block"
              >
                Login as Ward Admin →
              </button>
            )}

            {credentials.loginType === "user" && (
              <p className="text-gray-600">
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => navigate("/signup")}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Sign up
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
