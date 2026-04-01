import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="relative overflow-hidden bg-[#2d221b] text-[#f8e8d4]">
      <svg
        viewBox="0 0 240 240"
        className="pointer-events-none absolute -bottom-14 -right-14 h-[200px] w-[200px] opacity-[0.04]"
        aria-hidden="true"
      >
        <circle cx="120" cy="120" r="100" fill="none" stroke="#ffffff" strokeWidth="6" />
        <circle cx="120" cy="120" r="16" fill="#ffffff" />
        <path d="M120 24v192M24 120h192M52 52l136 136M188 52 52 188" stroke="#ffffff" strokeWidth="4" />
      </svg>

      <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="font-heading text-2xl font-bold text-white">{t.appName}</h3>
            <p className="mt-2 text-sm text-[#d9bea2]">{t.tagline}</p>
            <p className="mt-3 text-sm font-semibold text-[#FFB347]">Made with India for India's Citizens</p>
          </div>

          <div>
            <h4 className="mb-3 font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm text-[#ecd6c0]">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/file-complaint">File Complaint</Link></li>
              <li><Link to="/map">Public Map</Link></li>
              <li><Link to="/forum">Forum</Link></li>
              <li><Link to="/leaderboard">Leaderboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-semibold text-white">Citizen Helplines</h4>
            <ul className="space-y-2 text-sm text-[#ecd6c0]">
              <li>Swachh Bharat: 1969</li>
              <li>CPGRAMS: 1800-11-0001</li>
              <li>PM Helpline: 1800-11-7800</li>
              <li>Nagar Helpline: 1800-222-000</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-semibold text-white">Contact</h4>
            <ul className="space-y-2 text-sm text-[#ecd6c0]">
              <li>help@nagarconnect.in</li>
              <li>+91 755 400 2000</li>
              <li>Bhopal Smart City Office</li>
              <li>@nagarconnect</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-[#FF8C0040] pt-4 text-center text-sm text-[#d9bea2]">
          NagarConnect - Empowering Nagrik, Transforming Nagarpalika
        </div>
      </div>
    </footer>
  );
};

export default Footer;
