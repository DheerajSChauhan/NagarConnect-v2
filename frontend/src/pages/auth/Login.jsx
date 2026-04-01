import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaHashtag, FaLock, FaUser } from "react-icons/fa";
import { supabase } from "../../config/supabase";
import { API_BASE_URL } from "../../config/api";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    city: "",
    loginType: "user",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.signupSuccess) {
      toast.success("Signup successful. Please log in.");
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const setLoginType = (loginType) => {
    setCredentials({ username: "", password: "", city: "", loginType });
    setError("");
  };

  const handleUserLogin = async () => {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.username,
      password: credentials.password,
    });

    if (authError) throw new Error(authError.message);
    if (!data.session) throw new Error("Login failed");

    localStorage.setItem("token", data.session.access_token);
    localStorage.setItem("refreshToken", data.session.refresh_token);

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    });

    if (response.ok) {
      const profile = await response.json();
      localStorage.setItem("user", JSON.stringify(profile.user));
      toast.success(`Welcome back, ${profile.user?.name || "User"}!`);
    } else {
      localStorage.setItem(
        "user",
        JSON.stringify({ email: credentials.username, role: "user" })
      );
      toast.success("Login successful");
    }

    navigate("/home");
  };

  const handleAdminLogin = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Admin login failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    toast.success(`Welcome back, ${data.user?.name || "Admin"}!`);
    navigate("/dashboard");
  };

  const handleOfficerLogin = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/officer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
        role: "city_officer",
        city: credentials.city,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Officer login failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    toast.success(`Welcome back, ${data.user?.name || "Officer"}!`);
    navigate("/officer-dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (credentials.loginType === "user") {
        await handleUserLogin();
      } else if (credentials.loginType === "admin") {
        await handleAdminLogin();
      } else {
        await handleOfficerLogin();
      }
    } catch (err) {
      setError(err.message || "Login failed");
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err.message || "Google login failed");
      toast.error(err.message || "Google login failed");
      setLoading(false);
    }
  };

  const usernameLabel = credentials.loginType === "officer" ? "Officer Email" : "Email";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md">
        <div className="bg-indigo-600 py-6 px-8 text-center">
          <h1 className="text-3xl font-bold text-white">NagarConnect</h1>
          <p className="text-indigo-100 mt-2">Community Grievance Portal</p>
        </div>

        <div className="p-8">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setLoginType("user")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                credentials.loginType === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setLoginType("admin")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                credentials.loginType === "admin"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setLoginType("officer")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                credentials.loginType === "officer"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              City Officer
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">{usernameLabel}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {credentials.loginType === "officer" ? (
              <div>
                <label className="block text-gray-700 mb-2">Assigned City</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaHashtag className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="city"
                    value={credentials.city}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Bhopal"
                    required
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label className="block text-gray-700 mb-2">Password</label>
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
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 disabled:bg-gray-100 transition"
              >
                Continue with Google
              </button>
            </>
          )}

          {credentials.loginType === "user" && (
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Sign up
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
