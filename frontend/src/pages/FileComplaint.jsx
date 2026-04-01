import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { FaCloudUploadAlt, FaTimes } from "react-icons/fa";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE_URL } from "../config/api";
import {
  URBAN_BODY_TYPES,
  findDistrictRecord,
  findStateCodeByName,
  findStateRecord,
  loadIndiaCitiesByStateCode,
  loadIndiaStates,
} from "../data/indiaLocations";
import { categoryOptions, suggestionByCategory } from "../data/mockData";

const steps = ["Complaint Basics", "Describe the Issue", "Location", "Photo Evidence", "Review & Submit"];

const priorityLevels = [
  { key: "urgent", label: "URGENT", className: "bg-red-600 text-white" },
  { key: "medium", label: "MEDIUM", className: "bg-orange-500 text-white" },
  { key: "low", label: "LOW", className: "bg-green-600 text-white" },
];

const priorityScoreMap = {
  urgent: 92,
  medium: 67,
  low: 38,
};

const MotionDiv = motion.div;

const PinSelector = ({ onPick }) => {
  useMapEvents({
    click(event) {
      onPick([event.latlng.lat, event.latlng.lng]);
    },
  });
  return null;
};

const FileComplaint = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [submitMessage, setSubmitMessage] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [locationMode, setLocationMode] = useState("live");
  const [form, setForm] = useState({
    title: "",
    category: "",
    priority: "medium",
    description: "",
    severity: 5,
    manualLocation: "",
    coordinates: null,
    state: "",
    stateCode: "",
    district: "",
    city: "",
    locality: "",
    urbanBodyType: "nagar_nigam",
    photoNotes: {},
  });
  const [photos, setPhotos] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptionsByState, setCityOptionsByState] = useState({});

  const progress = ((step + 1) / steps.length) * 100;
  const suggestionChips = suggestionByCategory[form.category] || suggestionByCategory.Other;

  const locationText = useMemo(() => {
    if (form.locality || form.city || form.district || form.state) {
      return [form.locality, form.city, form.district, form.state].filter(Boolean).join(", ");
    }
    if (form.coordinates) return `${form.coordinates[0].toFixed(5)}, ${form.coordinates[1].toFixed(5)}`;
    if (form.manualLocation) return form.manualLocation;
    return "Not provided";
  }, [form.city, form.coordinates, form.district, form.locality, form.manualLocation, form.state]);

  const districts = useMemo(() => {
    const stateRecord = findStateRecord(form.state);
    return stateRecord?.districts || [];
  }, [form.state]);

  const cities = useMemo(() => {
    const apiCities = cityOptionsByState[form.stateCode] || [];
    if (apiCities.length > 0) return apiCities;
    const districtRecord = findDistrictRecord(form.state, form.district);
    return districtRecord?.cities || [];
  }, [cityOptionsByState, form.district, form.state, form.stateCode]);

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
    if (!form.stateCode) return undefined;

    const loadCities = async () => {
      const rows = await loadIndiaCitiesByStateCode(form.stateCode);
      if (active) {
        setCityOptionsByState((prev) => ({
          ...prev,
          [form.stateCode]: rows,
        }));
      }
    };

    loadCities();

    return () => {
      active = false;
    };
  }, [form.stateCode]);

  const syncLocationFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = response.ok ? await response.json() : null;
      const addr = data?.address || {};

      const stateValue = addr.state || "";
      const districtValue = addr.county || addr.state_district || "";
      const cityValue = addr.city || addr.town || addr.municipality || addr.village || "";
      const localityValue = addr.suburb || addr.neighbourhood || addr.road || addr.hamlet || "";
      const stateCode = findStateCodeByName(stateValue, stateOptions);

      setForm((prev) => ({
        ...prev,
        coordinates: [lat, lng],
        state: stateValue,
        stateCode: stateCode || prev.stateCode,
        district: districtValue,
        city: cityValue,
        locality: localityValue,
      }));
      setFormErrors((prev) => ({ ...prev, location: "" }));
    } catch {
      setForm((prev) => ({ ...prev, coordinates: [lat, lng] }));
      setFormErrors((prev) => ({ ...prev, location: "" }));
    }
  };

  const goNext = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const goBack = () => setStep((prev) => Math.max(prev - 1, 0));
  const removePhotoAt = (index) => setPhotos((prev) => prev.filter((_, idx) => idx !== index));

  const getStepErrors = (stepToValidate) => {
    const nextErrors = {};

    if (stepToValidate === 0) {
      if (!form.title.trim()) {
        nextErrors.title = "Complaint title is required";
      }
      if (!form.category) {
        nextErrors.category = "Please select a category";
      }
      if (!form.priority) {
        nextErrors.priority = "Please select a priority";
      }
    }

    if (stepToValidate === 1) {
      if (!form.description.trim()) {
        nextErrors.description = "Issue description is required";
      } else if (form.description.trim().length < 15) {
        nextErrors.description = "Description should be at least 15 characters";
      }
    }

    if (stepToValidate === 2) {
      const hasCoordinates = Array.isArray(form.coordinates) && form.coordinates.length === 2;
      const hasHierarchy = Boolean(form.state && form.district && form.city && form.locality.trim());
      const hasManualLocation = Boolean(form.manualLocation.trim() || hasHierarchy);
      if (!hasCoordinates && !hasManualLocation && !hasHierarchy) {
        nextErrors.location = "Location is required. Use GPS, pin map, or select State/District/City/Locality.";
      }
    }

    return nextErrors;
  };

  const validateStep = (stepToValidate) => {
    const nextErrors = getStepErrors(stepToValidate);

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    goNext();
  };

  const uploadPhotos = (fileList) => {
    const accepted = [...fileList].filter((file) => file.size <= 5 * 1024 * 1024).slice(0, 4 - photos.length);
    setPhotos((prev) => [...prev, ...accepted]);
  };

  const buildLocalComplaint = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const now = new Date().toISOString();

    return {
      _id: `local-${Date.now()}`,
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      status: "Pending",
      location: form.manualLocation || locationText,
      locationName: form.manualLocation || locationText,
      coordinates: form.coordinates,
      state: form.state,
      stateCode: form.stateCode,
      district: form.district,
      city: form.city,
      locality: form.locality,
      urbanBodyType: form.urbanBodyType,
      image: null,
      user,
      createdAt: now,
    };
  };

  const handleSubmit = async () => {
    const combinedErrors = {
      ...getStepErrors(0),
      ...getStepErrors(1),
      ...getStepErrors(2),
    };
    setFormErrors(combinedErrors);

    if (Object.keys(combinedErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setSubmitMessage("");

    const targetScore = priorityScoreMap[form.priority] || priorityScoreMap.low;
    const interval = setInterval(() => {
      setScore((prev) => {
        const next = prev + 4;
        if (next >= targetScore) {
          clearInterval(interval);
          return targetScore;
        }
        return next;
      });
    }, 80);

    const token = localStorage.getItem("token");
    const payload = new FormData();
    payload.append("title", form.title);
    payload.append("description", form.description);
    payload.append("category", form.category);
    payload.append("priority", form.priority);
    payload.append("location", form.manualLocation || locationText);
    payload.append("state", form.state);
    payload.append("stateCode", form.stateCode);
    payload.append("district", form.district);
    payload.append("city", form.city);
    payload.append("urbanBodyType", form.urbanBodyType);
    payload.append("locality", form.locality || form.manualLocation);
    if (Array.isArray(form.coordinates)) {
      payload.append("latitude", String(form.coordinates[0]));
      payload.append("longitude", String(form.coordinates[1]));
    }
    if (photos[0]) {
      payload.append("image", photos[0]);
    }

    let createdComplaint = null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/complaints`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      if (!response.ok) {
        throw new Error("API submission failed");
      }

      const data = await response.json();
      createdComplaint = data.complaint;
      setSubmitMessage("Complaint submitted to server successfully.");
    } catch {
      const localComplaint = buildLocalComplaint();
      const localList = JSON.parse(localStorage.getItem("localComplaints") || "[]");
      localStorage.setItem("localComplaints", JSON.stringify([localComplaint, ...localList]));
      window.dispatchEvent(new Event("complaints:updated"));
      createdComplaint = localComplaint;
      setSubmitMessage("Saved locally. Sync with backend will happen once auth session is valid.");
    }

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } });
      localStorage.setItem("lastCreatedComplaint", JSON.stringify(createdComplaint));
      window.dispatchEvent(new Event("complaints:updated"));
      setTimeout(() => navigate("/my-complaints"), 1200);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f5f5ff_0%,#eef3fb_100%)] dark:bg-[#0D1117]">
      <Navbar />
      <div className="mx-auto max-w-[680px] px-4 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
          <div className="mb-6">
            <p className="text-sm font-semibold text-emerald-700">Step {step + 1} of {steps.length}</p>
            <h1 className="font-heading text-2xl font-bold">{steps[step]}</h1>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
              <MotionDiv className="h-2 rounded-full bg-emerald-600" animate={{ width: `${progress}%` }} />
            </div>
          </div>

          {step === 0 ? (
            <div className="space-y-5">
              <div>
                <label htmlFor="complaint-title" className="mb-2 block text-sm font-medium">Complaint Title</label>
                <input
                  id="complaint-title"
                  value={form.title}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, title: event.target.value }));
                    setFormErrors((prev) => ({ ...prev, title: "" }));
                  }}
                  className={`w-full rounded-xl border px-4 py-3 ${formErrors.title ? "border-red-500" : "border-slate-300"}`}
                  placeholder="Example: Severe pothole near bus stand"
                />
                {formErrors.title ? <p className="mt-1 text-xs text-red-600">{formErrors.title}</p> : null}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Category</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {categoryOptions.map((category) => (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, category: category.key }));
                        setFormErrors((prev) => ({ ...prev, category: "" }));
                      }}
                      className={`rounded-xl border p-3 text-left ${
                        form.category === category.key
                          ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200"
                          : "border-slate-300"
                      }`}
                    >
                      <p className="text-xl">{category.icon}</p>
                      <p className="mt-2 text-xs font-semibold">{category.labelEn || category.label}</p>
                      <p className="text-[11px] text-[#7A6652]">{category.labelHi || category.label}</p>
                    </button>
                  ))}
                </div>
                {formErrors.category ? <p className="mt-2 text-xs text-red-600">{formErrors.category}</p> : null}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Priority Level</p>
                <div className="grid grid-cols-3 gap-2">
                  {priorityLevels.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, priority: item.key }));
                        setFormErrors((prev) => ({ ...prev, priority: "" }));
                      }}
                      className={`rounded-full px-3 py-2 text-sm font-bold ${
                        form.priority === item.key ? item.className : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {formErrors.priority ? <p className="mt-2 text-xs text-red-600">{formErrors.priority}</p> : null}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <label htmlFor="issue-description" className="block text-sm font-medium">Describe the issue in detail</label>
              <textarea
                id="issue-description"
                value={form.description}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, description: event.target.value }));
                  setFormErrors((prev) => ({ ...prev, description: "" }));
                }}
                className={`h-40 w-full rounded-xl border p-4 ${formErrors.description ? "border-red-500" : "border-slate-300"}`}
                placeholder="What happened, how long, and who is affected?"
              />
              {formErrors.description ? <p className="text-xs text-red-600">{formErrors.description}</p> : null}
              <p className="text-right text-xs text-slate-500">{form.description.length} characters</p>

              <div className="flex flex-wrap gap-2">
                {suggestionChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, description: `${prev.description} ${chip}`.trim() }))}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="severity" className="mb-2 block text-sm font-medium">Severity: {form.severity} / 10</label>
                <input
                  id="severity"
                  type="range"
                  min="1"
                  max="10"
                  value={form.severity}
                  onChange={(event) => setForm((prev) => ({ ...prev, severity: Number(event.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { key: "live", label: "Auto GPS detect", icon: "📍" },
                  { key: "manual", label: "Manual State/District/City", icon: "🧭" },
                  { key: "map", label: "Pin on map", icon: "🗺️" },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setLocationMode(mode.key)}
                    className={`rounded-xl border p-3 text-left ${
                      locationMode === mode.key ? "border-civic-blue bg-blue-50" : "border-slate-300"
                    }`}
                  >
                    <p className="text-xl">{mode.icon}</p>
                    <p className="mt-2 text-sm font-semibold">{mode.label}</p>
                  </button>
                ))}
              </div>

              {locationMode === "live" ? (
                <button
                  type="button"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => {
                    if (!globalThis.navigator?.geolocation) return;
                    globalThis.navigator.geolocation.getCurrentPosition((pos) => {
                      syncLocationFromCoordinates(pos.coords.latitude, pos.coords.longitude);
                    });
                  }}
                >
                  Detect GPS + Fill Location
                </button>
              ) : null}

              {locationMode === "map" ? (
                <div className="h-64 overflow-hidden rounded-xl border border-slate-300">
                  <MapContainer center={[23.2599, 77.4126]} zoom={12} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <PinSelector
                      onPick={([lat, lng]) => {
                        syncLocationFromCoordinates(lat, lng);
                      }}
                    />
                    {form.coordinates ? <Marker position={form.coordinates} /> : null}
                  </MapContainer>
                </div>
              ) : null}

              {locationMode === "manual" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={form.state}
                    onChange={(event) => {
                      const selectedStateCode = findStateCodeByName(event.target.value, stateOptions);
                      setForm((prev) => ({
                        ...prev,
                        state: event.target.value,
                        stateCode: selectedStateCode || "",
                        district: "",
                        city: "",
                        locality: "",
                      }));
                      setFormErrors((prev) => ({ ...prev, location: "" }));
                    }}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  >
                    <option value="">Select State</option>
                    {stateOptions.map((item) => (
                      <option key={item.iso2} value={item.name}>{item.name}</option>
                    ))}
                  </select>

                  <select
                    value={form.district}
                    onChange={(event) => setForm((prev) => ({ ...prev, district: event.target.value, city: "", locality: "" }))}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    disabled={!form.state}
                  >
                    <option value="">Select District</option>
                    {districts.map((item) => (
                      <option key={item.district} value={item.district}>{item.district}</option>
                    ))}
                  </select>

                  <select
                    value={form.city}
                    onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    disabled={!form.district}
                  >
                    <option value="">Select City</option>
                    {cities.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>

                  <select
                    value={form.urbanBodyType}
                    onChange={(event) => setForm((prev) => ({ ...prev, urbanBodyType: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  >
                    {URBAN_BODY_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>

                  <input
                    value={form.locality}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, locality: event.target.value, manualLocation: event.target.value }));
                      setFormErrors((prev) => ({ ...prev, location: "" }));
                    }}
                    className="sm:col-span-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                    placeholder="Enter locality"
                  />
                </div>
              ) : null}

              <p className="text-sm text-slate-500">Selected: {locationText}</p>
              {formErrors.location ? <p className="text-xs text-red-600">{formErrors.location}</p> : null}
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({ ...prev, manualLocation: "", coordinates: null }));
                }}
                className="text-xs text-slate-500 underline"
              >
                Clear location
              </button>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <label
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center"
                onDrop={(event) => {
                  event.preventDefault();
                  uploadPhotos(event.dataTransfer.files);
                }}
                onDragOver={(event) => event.preventDefault()}
              >
                <FaCloudUploadAlt className="text-4xl text-emerald-700" />
                <p className="mt-3 text-sm">Drag photos here or click to upload (JPG, PNG, WEBP up to 5MB)</p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    uploadPhotos(event.target.files);
                    setFormErrors((prev) => ({ ...prev, photos: "" }));
                  }}
                />
              </label>
              {formErrors.photos ? <p className="text-xs text-red-600">{formErrors.photos}</p> : null}

              <div className="grid grid-cols-2 gap-3">
                {photos.map((photo, index) => (
                  <div key={`${photo.name}-${index}`} className="rounded-xl border border-slate-300 p-2">
                    <div className="relative h-24 overflow-hidden rounded-lg bg-slate-100">
                      <img src={URL.createObjectURL(photo)} alt={photo.name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhotoAt(index)}
                        className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <input
                      placeholder="Add a note about this photo"
                      className="mt-2 w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      value={form.photoNotes[index] || ""}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          photoNotes: { ...prev.photoNotes, [index]: event.target.value },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold">Review Summary</h3>
                <p className="mt-2 text-sm">Title: {form.title || "-"}</p>
                <p className="text-sm">Category: {form.category}</p>
                <p className="text-sm">Priority: {form.priority.toUpperCase()}</p>
                <p className="text-sm">Location: {locationText}</p>
                <p className="text-sm">Urban Body: {form.urbanBodyType}</p>
                <p className="text-sm">Photos: {photos.length} (optional)</p>
              </div>

              {submitting ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">Submitting complaint...</p>
                  <div className="mt-3 h-3 w-full rounded-full bg-emerald-100">
                    <div className="h-3 rounded-full bg-emerald-600 transition-all" style={{ width: `${score}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-emerald-700">AI Priority Score: {score}/100</p>
                </div>
              ) : null}

              {submitted ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
                  <p className="font-semibold">Complaint #NC-2025-{Math.floor(1000 + Math.random() * 9000)} filed! We&apos;ll notify you of updates.</p>
                  <p className="mt-2 text-sm">AI Solution: Contact Road Control Room at 1800-555-ROAD and share this complaint ID for quick dispatch.</p>
                  {submitMessage ? <p className="mt-2 text-xs text-blue-700">{submitMessage}</p> : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between">
            <button type="button" onClick={goBack} disabled={step === 0} className="rounded-xl border border-slate-300 px-4 py-2 disabled:opacity-40">
              Back
            </button>

            {step < steps.length - 1 ? (
              <button type="button" onClick={handleNext} className="rounded-xl bg-emerald-700 px-5 py-2 text-white">Next</button>
            ) : (
              <button type="button" onClick={handleSubmit} className="rounded-xl bg-civic-blue px-5 py-2 text-white">
                Submit Complaint
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FileComplaint;
