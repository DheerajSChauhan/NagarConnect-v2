import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);

const TRANSLATIONS = {
  en: {
    appName: "NagarConnect",
    tagline: "Where Problems Meet Solutions",
    login: "Login",
    signUp: "Sign Up",
    fileComplaint: "File Complaint",
    exploreMap: "Explore Map",
    nav: {
      home: "Home",
      fileComplaint: "File Complaint",
      myComplaints: "My Complaints",
      publicMap: "Public Map",
      forum: "Forum",
      more: "More",
      notifications: "Notifications",
      profile: "My Profile",
      settings: "Settings",
      logout: "Logout",
      menu: "Menu",
    },
    map: {
      nearbyComplaints: "Nearby Complaints",
      showHeatmap: "Show Heatmap",
      hideHeatmap: "Hide Heatmap",
      upvotes: "Upvotes",
    },
    settings: {
      title: "Settings",
      subtitle: "Manage your language and preferences",
      language: "Language",
      description: "Choose your preferred language for the UI text.",
      preview: "Preview",
      save: "Save Settings",
      saved: "Settings saved successfully",
    },
  },
  hi: {
    appName: "नागरकनेक्ट",
    tagline: "जहां समस्याएं समाधान से मिलती हैं",
    login: "लॉगिन",
    signUp: "साइन अप",
    fileComplaint: "शिकायत दर्ज करें",
    exploreMap: "मैप देखें",
    nav: {
      home: "होम",
      fileComplaint: "शिकायत दर्ज करें",
      myComplaints: "मेरी शिकायतें",
      publicMap: "पब्लिक मैप",
      forum: "फोरम",
      more: "और",
      notifications: "सूचनाएं",
      profile: "मेरी प्रोफाइल",
      settings: "सेटिंग्स",
      logout: "लॉगआउट",
      menu: "मेनू",
    },
    map: {
      nearbyComplaints: "आस-पास की शिकायतें",
      showHeatmap: "हीटमैप दिखाएं",
      hideHeatmap: "हीटमैप छिपाएं",
      upvotes: "अपवोट",
    },
    settings: {
      title: "सेटिंग्स",
      subtitle: "भाषा और पसंद प्रबंधित करें",
      language: "भाषा",
      description: "यूआई टेक्स्ट के लिए अपनी पसंदीदा भाषा चुनें।",
      preview: "पूर्वावलोकन",
      save: "सेटिंग्स सेव करें",
      saved: "सेटिंग्स सफलतापूर्वक सेव हुई",
    },
  },
  bn: {
    appName: "নগরকনেক্ট",
    tagline: "সমস্যা থেকে সমাধান",
  },
  mr: {
    appName: "नागरकनेक्ट",
    tagline: "समस्या ते समाधान",
  },
  ta: {
    appName: "நகர் கனெக்ட்",
    tagline: "பிரச்சினையிலிருந்து தீர்வு",
  },
  te: {
    appName: "నగర్ కనెక్ట్",
    tagline: "సమస్యల నుండి పరిష్కారం",
  },
  gu: {
    appName: "નગરકનેક્ટ",
    tagline: "સમસ્યાથી ઉકેલ",
  },
  kn: {
    appName: "ನಗರಕನೆಕ್ಟ್",
    tagline: "ಸಮಸ್ಯೆಯಿಂದ ಪರಿಹಾರ",
  },
  ml: {
    appName: "നഗർകണക്റ്റ്",
    tagline: "പ്രശ്നങ്ങളിൽ നിന്ന് പരിഹാരം",
  },
  pa: {
    appName: "ਨਗਰਕਨੈਕਟ",
    tagline: "ਸਮੱਸਿਆ ਤੋਂ ਹੱਲ",
  },
  ur: {
    appName: "نگر کنیکٹ",
    tagline: "مسئلے سے حل",
  },
  or: {
    appName: "ନଗର କନେକ୍ଟ",
    tagline: "ସମସ୍ୟାରୁ ସମାଧାନ",
  },
};

export const AVAILABLE_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi (हिंदी)" },
  { code: "bn", label: "Bengali (বাংলা)" },
  { code: "mr", label: "Marathi (मराठी)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
  { code: "te", label: "Telugu (తెలుగు)" },
  { code: "gu", label: "Gujarati (ગુજરાતી)" },
  { code: "kn", label: "Kannada (ಕನ್ನಡ)" },
  { code: "ml", label: "Malayalam (മലയാളം)" },
  { code: "pa", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { code: "ur", label: "Urdu (اردو)" },
  { code: "or", label: "Odia (ଓଡ଼ିଆ)" },
];

const getByPath = (obj, path) => {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  const value = useMemo(() => {
    const current = TRANSLATIONS[language] || TRANSLATIONS.en;
    const tr = (key, fallback = "") => {
      const direct = getByPath(current, key);
      if (direct !== undefined) return direct;
      const english = getByPath(TRANSLATIONS.en, key);
      if (english !== undefined) return english;
      return fallback || key;
    };

    return {
      language,
      setLanguage,
      availableLanguages: AVAILABLE_LANGUAGES,
      tr,
      t: {
        appName: tr("appName"),
        tagline: tr("tagline"),
        login: tr("login"),
        signUp: tr("signUp"),
        fileComplaint: tr("fileComplaint"),
        exploreMap: tr("exploreMap"),
      },
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
};
