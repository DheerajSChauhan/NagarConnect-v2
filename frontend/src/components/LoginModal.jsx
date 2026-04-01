import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { FaGoogle, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  findDistrictRecord,
  findStateCodeByName,
  findStateRecord,
  loadIndiaCitiesByStateCode,
  loadIndiaStates,
} from "../data/indiaLocations";

const ADMIN_SECRET = "NAGAR-ADMIN-2026";

const emptySignup = {
  name: "",
  email: "",
  phone: "",
  state: "",
  stateCode: "",
  district: "",
  city: "",
  locality: "",
  department: "Roads",
  employeeId: "",
  password: "",
  confirmPassword: "",
  role: "citizen",
  secretKey: "",
};

const LoginForm = ({ loginForm, setLoginForm, loginRole, setLoginRole, adminSecret, setAdminSecret, handleLogin }) => {
  return (
    <form className="space-y-3" onSubmit={handleLogin}>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setLoginRole("citizen")}
          className={`rounded-xl px-3 py-2 text-sm ${loginRole === "citizen" ? "bg-emerald-600 text-white" : "bg-slate-100"}`}
        >
          Citizen
        </button>
        <button
          type="button"
          onClick={() => setLoginRole("super_admin")}
          className={`rounded-xl px-3 py-2 text-sm ${loginRole === "super_admin" ? "bg-emerald-600 text-white" : "bg-slate-100"}`}
        >
          Super Admin
        </button>
      </div>
      <input
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
        placeholder="Email"
        type="email"
        value={loginForm.email}
        onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
      />
      <input
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
        placeholder="Password"
        type="password"
        value={loginForm.password}
        onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
      />
      {loginRole === "super_admin" ? (
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
          placeholder="Super Admin Secret Key"
          value={adminSecret}
          onChange={(event) => setAdminSecret(event.target.value)}
        />
      ) : null}
      <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700">
        Login
      </button>
      <button type="button" className="w-full text-right text-xs text-slate-500">Forgot Password?</button>
      <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold">
        <FaGoogle /> Continue with Google
      </button>
    </form>
  );
};

const SignupForm = ({ signupForm, setSignupForm, handleSignup }) => {
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptionsByState, setCityOptionsByState] = useState({});
  const districts = findStateRecord(signupForm.state)?.districts || [];
  const cities = cityOptionsByState[signupForm.stateCode] || findDistrictRecord(signupForm.state, signupForm.district)?.cities || [];

  useEffect(() => {
    let active = true;

    const loadStates = async () => {
      const rows = await loadIndiaStates();
      if (active) {
        setStateOptions(rows);
      }
    };

    loadStates();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!signupForm.stateCode) return undefined;

    const loadCities = async () => {
      const rows = await loadIndiaCitiesByStateCode(signupForm.stateCode);
      if (active) {
        setCityOptionsByState((prev) => ({ ...prev, [signupForm.stateCode]: rows }));
      }
    };

    loadCities();

    return () => {
      active = false;
    };
  }, [signupForm.stateCode]);

  return (
    <form className="space-y-3" onSubmit={handleSignup}>
      <input className="w-full rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Full Name" value={signupForm.name} onChange={(event) => setSignupForm((prev) => ({ ...prev, name: event.target.value }))} />
      <input className="w-full rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Email" type="email" value={signupForm.email} onChange={(event) => setSignupForm((prev) => ({ ...prev, email: event.target.value }))} />
      <input className="w-full rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Phone" value={signupForm.phone} onChange={(event) => setSignupForm((prev) => ({ ...prev, phone: event.target.value }))} />
      <select
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
        value={signupForm.state}
        onChange={(event) => {
          const stateCode = findStateCodeByName(event.target.value, stateOptions);
          setSignupForm((prev) => ({ ...prev, state: event.target.value, stateCode, district: "", city: "" }));
        }}
      >
        <option value="">Select State</option>
        {stateOptions.map((item) => (
          <option key={item.iso2} value={item.name}>{item.name}</option>
        ))}
      </select>
      <select
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
        value={signupForm.district}
        disabled={!signupForm.state}
        onChange={(event) => setSignupForm((prev) => ({ ...prev, district: event.target.value, city: "" }))}
      >
        <option value="">Select District</option>
        {districts.map((item) => (
          <option key={item.district} value={item.district}>{item.district}</option>
        ))}
      </select>
      <select
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
        value={signupForm.city}
        disabled={!signupForm.district}
        onChange={(event) => setSignupForm((prev) => ({ ...prev, city: event.target.value }))}
      >
        <option value="">Select City</option>
        {cities.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
      <input className="w-full rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Locality" value={signupForm.locality} onChange={(event) => setSignupForm((prev) => ({ ...prev, locality: event.target.value }))} />
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={() => setSignupForm((prev) => ({ ...prev, role: "citizen" }))} className={`rounded-xl px-3 py-2 text-sm ${signupForm.role === "citizen" ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>Citizen</button>
        <button type="button" onClick={() => setSignupForm((prev) => ({ ...prev, role: "city_officer" }))} className={`rounded-xl px-3 py-2 text-sm ${signupForm.role === "city_officer" ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>City Officer</button>
        <button type="button" onClick={() => setSignupForm((prev) => ({ ...prev, role: "super_admin" }))} className={`rounded-xl px-3 py-2 text-sm ${signupForm.role === "super_admin" ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>Super Admin</button>
      </div>
      {["city_officer", "district_officer", "state_officer", "dept_admin"].includes(signupForm.role) ? (
        <>
          <select
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            value={signupForm.department}
            onChange={(event) => setSignupForm((prev) => ({ ...prev, department: event.target.value }))}
          >
            {["Roads", "Water", "Sanitation", "Electricity", "Other"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            placeholder="Employee ID"
            value={signupForm.employeeId}
            onChange={(event) => setSignupForm((prev) => ({ ...prev, employeeId: event.target.value }))}
          />
        </>
      ) : null}
      {signupForm.role === "super_admin" ? (
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
          placeholder="Super Admin Secret Key"
          value={signupForm.secretKey}
          onChange={(event) => setSignupForm((prev) => ({ ...prev, secretKey: event.target.value }))}
        />
      ) : null}
      <input className="w-full rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Password" type="password" value={signupForm.password} onChange={(event) => setSignupForm((prev) => ({ ...prev, password: event.target.value }))} />
      <input className="w-full rounded-xl border border-slate-300 px-4 py-2.5" placeholder="Confirm Password" type="password" value={signupForm.confirmPassword} onChange={(event) => setSignupForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} />
      <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700">Create Account</button>
    </form>
  );
};

SignupForm.propTypes = {
  signupForm: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    district: PropTypes.string.isRequired,
    city: PropTypes.string.isRequired,
    locality: PropTypes.string.isRequired,
    department: PropTypes.string.isRequired,
    employeeId: PropTypes.string.isRequired,
    password: PropTypes.string.isRequired,
    confirmPassword: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    secretKey: PropTypes.string,
  }).isRequired,
  setSignupForm: PropTypes.func.isRequired,
  handleSignup: PropTypes.func.isRequired,
};

const LoginModal = () => {
  const {
    authModalOpen,
    authTab,
    setAuthTab,
    closeAuthModal,
    login,
    signup,
  } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginRole, setLoginRole] = useState("citizen");
  const [adminSecret, setAdminSecret] = useState("");
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [error, setError] = useState("");

  const title = useMemo(() => (authTab === "login" ? t.login : t.signUp), [authTab, t]);

  const handleLogin = (event) => {
    event.preventDefault();
    setError("");
    if (!loginForm.email || !loginForm.password) {
      setError("Email and password are required");
      return;
    }
    if (loginRole === "super_admin" && adminSecret !== ADMIN_SECRET) {
      setError("Invalid admin secret key");
      return;
    }

    const role = loginRole;
    login({ email: loginForm.email, role, name: role === "super_admin" ? "Nagar Super Admin" : "Nagar Citizen" });

    if (role === "super_admin" || role === "admin") {
      navigate("/admin");
      return;
    }

    navigate("/");
  };

  const handleSignup = (event) => {
    event.preventDefault();
    setError("");
    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      setError("Please complete all required fields");
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      signup({
        name: signupForm.name,
        email: signupForm.email,
        state: signupForm.state,
        district: signupForm.district,
        city: signupForm.city,
        locality: signupForm.locality,
        department: signupForm.department,
        employeeId: signupForm.employeeId,
        role: signupForm.role,
        secretKey: signupForm.secretKey,
      });
      setSignupForm(emptySignup);
      if (signupForm.role === "super_admin") {
        navigate("/admin");
      }
    } catch (err) {
      setError(err.message || "Signup failed");
    }
  };

  if (!authModalOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[3000] overflow-y-auto bg-black/50 p-4"
        style={{ backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto my-6 w-full max-w-[420px] max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-50">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t.tagline}</p>
            </div>
            <button
              type="button"
              onClick={closeAuthModal}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close auth modal"
            >
              <FaTimes />
            </button>
          </div>

          <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setAuthTab("login")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                authTab === "login" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAuthTab("signup")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                authTab === "signup" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500"
              }`}
            >
              Sign Up
            </button>
          </div>

          {error ? <p className="mb-3 rounded-lg bg-red-100 p-2 text-sm text-red-700">{error}</p> : null}

          {authTab === "login" ? (
            <LoginForm
              loginForm={loginForm}
              setLoginForm={setLoginForm}
              loginRole={loginRole}
              setLoginRole={setLoginRole}
              adminSecret={adminSecret}
              setAdminSecret={setAdminSecret}
              handleLogin={handleLogin}
            />
          ) : (
            <SignupForm signupForm={signupForm} setSignupForm={setSignupForm} handleSignup={handleSignup} />
          )}
        </div>
      </div>
    </AnimatePresence>
  );
};

export default LoginModal;
