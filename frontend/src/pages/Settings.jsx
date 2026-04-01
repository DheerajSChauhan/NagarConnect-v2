import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useLanguage } from "../context/LanguageContext";

const Settings = () => {
  const { language, setLanguage, availableLanguages, tr } = useLanguage();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <Navbar />

      <main className="section-shell section-pad">
        <section className="kolam-border mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-card md:p-8">
          <h1 className="font-heading text-3xl font-extrabold text-[#1C1008]">{tr("settings.title", "Settings")}</h1>
          <p className="mt-2 font-body text-sm text-[#7A6652]">{tr("settings.subtitle", "Manage your language and preferences")}</p>

          <div className="mt-6 rounded-xl border border-[#eadfce] bg-[#fff8ef] p-4">
            <p className="font-accent text-base font-semibold text-[#1C1008]">{tr("settings.language", "Language")}</p>
            <p className="mt-1 text-sm text-[#7A6652]">{tr("settings.description", "Choose your preferred language for the UI text.")}</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {availableLanguages.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLanguage(item.code)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
                    language === item.code
                      ? "border-[#1A6B3C] bg-[#1A6B3C] text-white"
                      : "border-[#E0D5C5] bg-white text-[#1C1008] hover:bg-[#f6efe4]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-[#eadfce] bg-white p-3">
              <p className="font-accent text-xs uppercase tracking-wide text-[#7A6652]">{tr("settings.preview", "Preview")}</p>
              <p className="mt-1 font-heading text-2xl text-[#1A6B3C]">{tr("appName", "NagarConnect")}</p>
              <p className="font-body text-sm text-[#7A6652]">{tr("tagline", "Where Problems Meet Solutions")}</p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="mt-4 rounded-lg bg-[#1A237E] px-4 py-2 font-accent font-semibold text-white"
            >
              {tr("settings.save", "Save Settings")}
            </button>

            {saved ? (
              <p className="mt-3 rounded-lg bg-[#e8f4ff] px-3 py-2 text-sm text-[#1A237E]">
                {tr("settings.saved", "Settings saved successfully")}
              </p>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
