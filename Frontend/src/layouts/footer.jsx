import { Link } from "react-router-dom";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 text-sm border-t border-slate-800">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4 text-white">
            <img 
              src="https://fmuznyrfnjdwxbqsdijw.supabase.co/storage/v1/object/public/uploads/Logo.png" 
              className="w-[45px] h-[32px] object-contain brightness-0 invert" 
              alt="VetCloud Logo"
            />
            <span className="text-xl font-bold tracking-tight">VetCloud</span>
          </div>
          <p className="mb-4 text-slate-400 text-xs sm:text-sm leading-relaxed">
            Connecting farmers and pet owners with qualified veterinary professionals anytime, anywhere.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-base">Quick Links</h4>
          <ul className="space-y-2.5 text-xs sm:text-sm">
            <li>
              <Link to="/login" onClick={scrollToTop} className="hover:text-green-400 transition-colors">
                Online Consultation
              </Link>
            </li>
            <li>
              <Link to="/clinics" onClick={scrollToTop} className="hover:text-green-400 transition-colors">
                Find a Clinic
              </Link>
            </li>
            <li>
              <Link to="/diseases" onClick={scrollToTop} className="hover:text-green-400 transition-colors">
                Disease Database
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-base">Support</h4>
          <ul className="space-y-2.5 text-xs sm:text-sm">
            <li>
              <Link to="/help" onClick={scrollToTop} className="hover:text-green-400 transition-colors">
                Help Center
              </Link>
            </li>
            <li>
              <Link to="/contact" onClick={scrollToTop} className="hover:text-green-400 transition-colors">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/privacy" onClick={scrollToTop} className="hover:text-green-400 transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" onClick={scrollToTop} className="hover:text-green-400 transition-colors">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-base">Contact Support</h4>
          <div className="space-y-2 text-xs sm:text-sm text-slate-400">
            <p className="flex items-center gap-1.5">
              <span className="font-medium text-slate-300">Email:</span> support@vetcloud.com
            </p>
            <p className="flex items-center gap-1.5">
              <span className="font-medium text-slate-300">Hotline:</span> 1-800-VET-CARE
            </p>
            <p className="text-xs text-slate-500 mt-2">Available 24 hours / 7 days a week</p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} VetCloud System. All rights reserved.
      </div>
    </footer>
  );
}