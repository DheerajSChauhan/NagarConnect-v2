"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaLock, FaHashtag } from "react-icons/fa";
import toast from "react-hot-toast";
import { supabase } from "../../config/supabase";
import { API_BASE_URL } from "../../config/api";

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    wardNumber: "",
    loginType: "user",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const signupSuccess = location.state?.signupSuccess;

  useEffect(() => {
    if (signupSuccess) {
      toast.success("Signup successful! Please log in with your credentials.");
    }
  }, [signupSuccess]);

  const handleChange = (e) => {
    coemailme, value } = e.target;
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
      if (credentials.loginType === "user") {
        // Sign in with Supabase Auth
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (authError) throw new Error(authError.message);

        if (!data.session) {
          throw new Error("Login failed. Please try again.");
        }

        // Store session info
        localStorage.setItem("token", data.session.access_token);
        localStorage.setItem("refreshToken", data.session.refresh_token);

        // Fetch user profile from backend
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        });

        if (response.ok) {
          const userProfile = await response.json();
          localStorage.setItem("user", JSON.stringify(userProfile.user));
          toast.success(`Welcome back, ${userProfile.user.name}!`);
        } else {
          toast.success("Login successful!");
        }

        navigate("/home");
      } else if (credentials.loginType === "admin") {
        // Admin login - still uses backend for custom admin users
        const response = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Admin login failed");

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success(`Welcome back, ${data.user.name || "Admin"}!`);
        navigate("/dashboard");
      } else if (credentials.loginType === "wardAdmin") {
        // Ward Admin login - still uses backend for custom ward admin users
        const response = await fetch(`${API_BASE_URL}/api/auth/wardadmin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            wardNumber: String(credentials.wardNumber),
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Ward Admin login failed");

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success(`Welcome back, ${data.user.name || "Ward Admin"}!`);
        navigate("/ward-dashboard");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md">
        <div className="bg-indigo-600 py-6 px-8 text-center">
          <h1 className="text-3xl font-bold text-white">NagarConnect</h1>
          <p className="text-indigo-100 mt-2">Community Grievance Portal</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {signupSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
              Signup successful! Please log in.
            </div>
          )}

          {/* Login Type Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => toggleLoginType("user")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                credentials.loginType === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              User2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {credentials.loginType === "wardAdmin" && (
              <div>
                <label className="block text-gray-700 mb-2">Ward Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaHashtag className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="wardNumber"
                    value={credentials.wardNumber}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Your ward number"
                    min="1"
                    max="20"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {credentials.loginType === "user" && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 disabled:bg-gray-100 transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </>
          )}

          <div className="mt-6 text-center">
            {credentials.loginType === "user" && (
              <p className="text-gray-600">
                Don't have an account?{" "}
                <a href="/signup" className="text-indigo-600 font-semibold hover:underline">
                  Sign up
                </ae="pill"
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
