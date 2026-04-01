export const INDIA_LOCATIONS = [
  {
    state: "Madhya Pradesh",
    stateCode: "MP",
    districts: [
      { district: "Bhopal", cities: ["Bhopal", "Berasia"] },
      { district: "Indore", cities: ["Indore", "Mhow"] },
      { district: "Jabalpur", cities: ["Jabalpur", "Sihora"] }
    ]
  },
  {
    state: "Maharashtra",
    stateCode: "MH",
    districts: [
      { district: "Pune", cities: ["Pune", "Pimpri-Chinchwad"] },
      { district: "Mumbai", cities: ["Mumbai", "Navi Mumbai"] },
      { district: "Nagpur", cities: ["Nagpur"] }
    ]
  },
  {
    state: "Uttar Pradesh",
    stateCode: "UP",
    districts: [
      { district: "Lucknow", cities: ["Lucknow"] },
      { district: "Varanasi", cities: ["Varanasi"] },
      { district: "Kanpur Nagar", cities: ["Kanpur"] }
    ]
  },
  {
    state: "Tamil Nadu",
    stateCode: "TN",
    districts: [
      { district: "Chennai", cities: ["Chennai"] },
      { district: "Coimbatore", cities: ["Coimbatore"] },
      { district: "Madurai", cities: ["Madurai"] }
    ]
  },
  {
    state: "Karnataka",
    stateCode: "KA",
    districts: [
      { district: "Bengaluru Urban", cities: ["Bengaluru"] },
      { district: "Mysuru", cities: ["Mysuru"] },
      { district: "Belagavi", cities: ["Belagavi"] }
    ]
  },
  {
    state: "Gujarat",
    stateCode: "GJ",
    districts: [
      { district: "Ahmedabad", cities: ["Ahmedabad"] },
      { district: "Surat", cities: ["Surat"] },
      { district: "Vadodara", cities: ["Vadodara"] }
    ]
  },
  {
    state: "West Bengal",
    stateCode: "WB",
    districts: [
      { district: "Kolkata", cities: ["Kolkata"] },
      { district: "Howrah", cities: ["Howrah"] },
      { district: "Darjeeling", cities: ["Siliguri"] }
    ]
  },
  {
    state: "Rajasthan",
    stateCode: "RJ",
    districts: [
      { district: "Jaipur", cities: ["Jaipur"] },
      { district: "Jodhpur", cities: ["Jodhpur"] },
      { district: "Udaipur", cities: ["Udaipur"] }
    ]
  }
];

const CSC_BASE_URL = "https://api.countrystatecity.in/v1";
const CSC_COUNTRY_CODE = "IN";
const CSC_API_KEY = (import.meta.env.VITE_CSC_API_KEY || "").trim();

const cscCache = {
  states: null,
  citiesByStateCode: {},
};

const cscRequest = async (path) => {
  if (!CSC_API_KEY) {
    throw new Error("Missing VITE_CSC_API_KEY");
  }

  const response = await fetch(`${CSC_BASE_URL}${path}`, {
    headers: {
      "X-CSCAPI-KEY": CSC_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`CSC API failed: ${response.status}`);
  }

  return response.json();
};

const fallbackStates = INDIA_LOCATIONS.map((item) => ({
  name: item.state,
  iso2: item.stateCode,
}));

const normalizeStateOptions = (rows) =>
  (rows || [])
    .map((item) => ({
      name: String(item.name || "").trim(),
      iso2: String(item.iso2 || "").trim().toUpperCase(),
    }))
    .filter((item) => item.name && item.iso2)
    .sort((a, b) => a.name.localeCompare(b.name));

const normalizeCityOptions = (rows) =>
  [...new Set((rows || []).map((item) => String(item.name || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );

export const loadIndiaStates = async () => {
  if (cscCache.states) {
    return cscCache.states;
  }

  try {
    const rows = await cscRequest(`/countries/${CSC_COUNTRY_CODE}/states`);
    const normalized = normalizeStateOptions(rows);
    cscCache.states = normalized.length > 0 ? normalized : fallbackStates;
  } catch {
    cscCache.states = fallbackStates;
  }

  return cscCache.states;
};

export const loadIndiaCitiesByStateCode = async (stateCode) => {
  const code = String(stateCode || "").trim().toUpperCase();
  if (!code) {
    return [];
  }

  if (cscCache.citiesByStateCode[code]) {
    return cscCache.citiesByStateCode[code];
  }

  try {
    const rows = await cscRequest(`/countries/${CSC_COUNTRY_CODE}/states/${code}/cities`);
    const normalized = normalizeCityOptions(rows);
    cscCache.citiesByStateCode[code] = normalized;
  } catch {
    cscCache.citiesByStateCode[code] = [];
  }

  return cscCache.citiesByStateCode[code];
};

export const findStateCodeByName = (stateName, stateOptions = null) => {
  const value = String(stateName || "").trim().toLowerCase();
  if (!value) return "";

  const source = Array.isArray(stateOptions) && stateOptions.length > 0 ? stateOptions : fallbackStates;
  const found = source.find((item) => String(item.name || "").trim().toLowerCase() === value);
  if (found) return found.iso2;

  const fallback = INDIA_LOCATIONS.find((item) => String(item.state).trim().toLowerCase() === value);
  return fallback?.stateCode || "";
};

export const URBAN_BODY_TYPES = [
  { value: "nagar_nigam", label: "Nagar Nigam" },
  { value: "nagar_palika", label: "Nagar Palika" },
  { value: "nagar_panchayat", label: "Nagar Panchayat" },
  { value: "gram_panchayat", label: "Gram Panchayat" }
];

export const findStateRecord = (stateName) => {
  return INDIA_LOCATIONS.find((item) => item.state === stateName) || null;
};

export const findDistrictRecord = (stateName, districtName) => {
  const state = findStateRecord(stateName);
  if (!state) return null;
  return state.districts.find((item) => item.district === districtName) || null;
};
