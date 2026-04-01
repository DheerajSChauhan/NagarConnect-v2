import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE_URL } from "../config/api";
import {
  findDistrictRecord,
  findStateCodeByName,
  findStateRecord,
  loadIndiaCitiesByStateCode,
  loadIndiaStates,
} from "../data/indiaLocations";

const ID_TYPES = ["Aadhaar", "PAN", "Voter ID", "Driving License", "Passport"];

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";

  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [verifyState, setVerifyState] = useState("not_verified");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [idFile, setIdFile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    state: "",
    stateCode: "",
    district: "",
    city: "",
    locality: "",
    phone: "",
    idType: "Aadhaar",
    idNumber: "",
  });

  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptionsByState, setCityOptionsByState] = useState({});

  const districts = findStateRecord(profileForm.state)?.districts || [];
  const cities = cityOptionsByState[profileForm.stateCode] || findDistrictRecord(profileForm.state, profileForm.district)?.cities || [];

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
    if (!profileForm.stateCode) return undefined;

    const loadCities = async () => {
      const rows = await loadIndiaCitiesByStateCode(profileForm.stateCode);
      if (active) {
        setCityOptionsByState((prev) => ({ ...prev, [profileForm.stateCode]: rows }));
      }
    };

    loadCities();

    return () => {
      active = false;
    };
  }, [profileForm.stateCode]);

  useEffect(() => {
    const loadProfile = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!storedUser || !token) {
        navigate("/login");
        return;
      }

      const parsed = JSON.parse(storedUser);
      setUser(parsed);

      const localVerification = JSON.parse(localStorage.getItem("profileVerification") || "{}");

      try {
        const [profileResp, verifyResp] = await Promise.all([
          fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/auth/verification`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const profileData = profileResp.ok ? await profileResp.json() : null;
        const verifyData = verifyResp.ok ? await verifyResp.json() : null;

        const serverUser = profileData?.user || parsed;
        const serverVerification = verifyData?.verification || {};

        setUser(serverUser);
        setProfileForm((prev) => ({
          ...prev,
          name: serverUser.name || parsed.name || "",
          email: serverUser.email || parsed.email || "",
          state: serverUser.state || parsed.state || "",
          stateCode: serverUser.stateCode || parsed.stateCode || findStateCodeByName(serverUser.state || parsed.state || ""),
          district: serverUser.district || parsed.district || "",
          city: serverUser.city || parsed.city || "",
          locality: serverUser.locality || parsed.locality || "",
          phone: localVerification.phone || "",
          idType: serverVerification.idType || localVerification.idType || "Aadhaar",
          idNumber: serverVerification.idNumber || localVerification.idNumber || "",
        }));
        setVerifyState(serverVerification.status || localVerification.status || "not_verified");
      } catch {
        setProfileForm((prev) => ({
          ...prev,
          name: parsed.name || "",
          email: parsed.email || "",
          state: parsed.state || "",
          stateCode: parsed.stateCode || findStateCodeByName(parsed.state || ""),
          district: parsed.district || "",
          city: parsed.city || "",
          locality: parsed.locality || "",
          phone: localVerification.phone || "",
          idType: localVerification.idType || "Aadhaar",
          idNumber: localVerification.idNumber || "",
        }));
        setVerifyState(localVerification.status || "not_verified");
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const verificationBadge = useMemo(() => {
    if (verifyState === "verified") return "bg-[#e5f6ea] text-[#1A6B3C] border-[#1A6B3C]";
    if (verifyState === "pending") return "bg-[#fff4e6] text-[#E65100] border-[#E65100]";
    return "bg-[#fdebec] text-[#C62828] border-[#C62828]";
  }, [verifyState]);

  const handleProfileSave = async () => {
    if (!user) return;
    setSaving(true);

    const nextUser = {
      ...user,
      name: profileForm.name,
      email: profileForm.email,
      state: profileForm.state,
      district: profileForm.district,
      city: profileForm.city,
      locality: profileForm.locality,
    };

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileForm.name,
          state: profileForm.state,
          district: profileForm.district,
          city: profileForm.city,
          locality: profileForm.locality,
          phone: profileForm.phone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      } else {
        localStorage.setItem("user", JSON.stringify(nextUser));
        setUser(nextUser);
      }
    } catch {
      localStorage.setItem("user", JSON.stringify(nextUser));
      setUser(nextUser);
    }

    localStorage.setItem(
      "profileVerification",
      JSON.stringify({
        status: verifyState,
        phone: profileForm.phone,
        idType: profileForm.idType,
        idNumber: profileForm.idNumber,
        updatedAt: new Date().toISOString(),
      })
    );

    setTimeout(() => setSaving(false), 500);
  };

  const handleIdFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validType = ["image/jpeg", "image/png", "application/pdf"].includes(file.type);
    if (!validType) {
      setVerifyMessage("Only JPG, PNG, or PDF files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setVerifyMessage("ID proof file must be under 5MB.");
      return;
    }

    setIdFile(file);
    setVerifyMessage("");
  };

  const handleVerify = async () => {
    if (!profileForm.idNumber.trim()) {
      setVerifyMessage("Please enter your government ID number.");
      return;
    }

    if (!idFile) {
      setVerifyMessage("Please upload a government-issued ID proof file.");
      return;
    }

    const token = localStorage.getItem("token");
    const payload = new FormData();
    payload.append("idType", profileForm.idType);
    payload.append("idNumber", profileForm.idNumber);
    payload.append("idProof", idFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verification`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setVerifyState(data.verification.status || "verified");
      setVerifyMessage("Verification submitted successfully. Your ID status is now verified.");
      localStorage.setItem(
        "profileVerification",
        JSON.stringify({
          status: data.verification.status || "verified",
          phone: profileForm.phone,
          idType: data.verification.idType || profileForm.idType,
          idNumber: data.verification.idNumber || profileForm.idNumber,
          documentName: idFile.name,
          verifiedAt: data.verification.verifiedAt || new Date().toISOString(),
        })
      );
    } catch (error) {
      setVerifyState("pending");
      setVerifyMessage(error.message || "Verification stored locally. Please complete backend DB setup.");
      localStorage.setItem(
        "profileVerification",
        JSON.stringify({
          status: "pending",
          phone: profileForm.phone,
          idType: profileForm.idType,
          idNumber: profileForm.idNumber,
          documentName: idFile.name,
          verifiedAt: new Date().toISOString(),
        })
      );
    }
  };

  if (!user || loadingProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <Navbar />

      <main className="section-shell section-pad">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section className="kolam-border rounded-2xl bg-white p-6 shadow-card">
            <h1 className="font-heading text-3xl font-extrabold text-[#1C1008]">My Profile</h1>
            <p className="mt-1 font-body text-sm text-[#7A6652]">Manage personal details and verification.</p>

            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-[#1A6B3C] bg-[#EAF4EC] text-2xl font-bold text-[#1A6B3C]">
                {(profileForm.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-accent text-xl font-semibold text-[#1C1008]">{profileForm.name || "Citizen"}</p>
                <p className="font-body text-sm text-[#7A6652]">{[profileForm.locality, profileForm.city, profileForm.state].filter(Boolean).join(", ") || "Location not set"}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="font-body text-sm font-semibold text-[#1C1008]">
                Full Name
                <input
                  className="mt-1 w-full rounded-lg border border-[#dfd4c2] px-3 py-2"
                  value={profileForm.name}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>

              <label className="font-body text-sm font-semibold text-[#1C1008]">
                Email
                <input
                  className="mt-1 w-full rounded-lg border border-[#dfd4c2] px-3 py-2"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </label>

              <label className="font-body text-sm font-semibold text-[#1C1008]">
                State
                <select
                  className="mt-1 w-full rounded-lg border border-[#dfd4c2] px-3 py-2"
                  value={profileForm.state}
                  onChange={(event) => {
                    const stateCode = findStateCodeByName(event.target.value, stateOptions);
                    setProfileForm((prev) => ({ ...prev, state: event.target.value, stateCode, district: "", city: "" }));
                  }}
                >
                  <option value="">Select State</option>
                  {stateOptions.map((item) => (
                    <option key={item.iso2} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </label>

              <label className="font-body text-sm font-semibold text-[#1C1008]">
                District
                <select
                  className="mt-1 w-full rounded-lg border border-[#dfd4c2] px-3 py-2"
                  value={profileForm.district}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, district: event.target.value, city: "" }))}
                >
                  <option value="">Select District</option>
                  {districts.map((item) => (
                    <option key={item.district} value={item.district}>{item.district}</option>
                  ))}
                </select>
              </label>

              <label className="font-body text-sm font-semibold text-[#1C1008]">
                City
                <select
                  className="mt-1 w-full rounded-lg border border-[#dfd4c2] px-3 py-2"
                  value={profileForm.city}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, city: event.target.value }))}
                >
                  <option value="">Select City</option>
                  {cities.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="font-body text-sm font-semibold text-[#1C1008]">
                Locality
                <input
                  className="mt-1 w-full rounded-lg border border-[#dfd4c2] px-3 py-2"
                  value={profileForm.locality}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, locality: event.target.value }))}
                />
              </label>

              <label className="font-body text-sm font-semibold text-[#1C1008]">
                Phone
                <input
                  className="mt-1 w-full rounded-lg border border-[#dfd4c2] px-3 py-2"
                  value={profileForm.phone}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="+91 XXXXX XXXXX"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleProfileSave}
              className="mt-5 rounded-lg bg-[#1A6B3C] px-5 py-2 font-accent font-semibold text-white"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </section>

          <section className="kolam-border rounded-2xl bg-white p-6 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl font-bold text-[#1C1008]">Government ID Verification</h2>
                <p className="mt-1 font-body text-sm text-[#7A6652]">Upload valid government ID proof to verify account.</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${verificationBadge}`}>
                {verifyState.replace("_", " ")}
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="font-body text-sm font-semibold text-[#1C1008]">
                ID Type
                <select
                  className="mt-1 w-full rounded-lg border border-[#dfd4c2] px-3 py-2"
                  value={profileForm.idType}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, idType: event.target.value }))}
                >
                  {ID_TYPES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="font-body text-sm font-semibold text-[#1C1008]">
                ID Number
                <input
                  className="mt-1 w-full rounded-lg border border-[#dfd4c2] px-3 py-2"
                  value={profileForm.idNumber}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, idNumber: event.target.value }))}
                  placeholder="Enter government ID number"
                />
              </label>

              <label className="font-body text-sm font-semibold text-[#1C1008]">
                Upload ID Proof (JPG/PNG/PDF)
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="mt-1 w-full rounded-lg border border-[#dfd4c2] px-3 py-2"
                  onChange={handleIdFile}
                />
              </label>

              {idFile ? (
                <p className="rounded-lg bg-[#f8f2e7] px-3 py-2 text-sm text-[#6b533d]">Selected file: {idFile.name}</p>
              ) : null}

              {verifyMessage ? (
                <p className="rounded-lg bg-[#eef6ff] px-3 py-2 text-sm text-[#1A237E]">{verifyMessage}</p>
              ) : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleVerify}
                  className="rounded-lg bg-[#1A237E] px-5 py-2 font-accent font-semibold text-white"
                >
                  Verify ID
                </button>
                <button
                  type="button"
                  onClick={handleProfileSave}
                  className="rounded-lg border border-[#1A6B3C] px-5 py-2 font-accent font-semibold text-[#1A6B3C]"
                >
                  Save Verification Data
                </button>
              </div>

              {activeTab === "settings" ? (
                <div className="mt-4 rounded-xl border border-[#ebdecc] bg-[#fff8ee] p-4">
                  <p className="font-accent text-sm font-semibold text-[#5d422d]">Settings Preview</p>
                  <p className="mt-1 text-sm text-[#7A6652]">Notification preferences and account settings can be expanded here.</p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
