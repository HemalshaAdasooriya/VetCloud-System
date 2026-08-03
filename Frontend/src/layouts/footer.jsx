import { HeartPulse } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 text-sm">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4 text-white">
              <img src="/public/Logo.png" className="w-[50px] h-[35px] mr-1 object-fill" />
              <span className="text-xl font-bold">VetCloud</span>
            </div>
            <p className="mb-4">Connecting farmers and pet owners with qualified veterinary professionals anytime, anywhere.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="hover:text-green-400">Online Consultation</Link></li>
              <li><Link to="/clinics" className="hover:text-green-400">Find a Clinic</Link></li>
              <li><Link to="/diseases" className="hover:text-green-400">Disease Database</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/help" className="hover:text-green-400">Help Center</Link></li>
              <li><Link to="/contact" className="hover:text-green-400">Contact Us</Link></li>
              <li><Link to="/privacy" className="hover:text-green-400">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <p>Email: support@vetcloud.com</p>
            <p>Phone: 1-800-VET-CARE</p>
          </div>
        </div>
    </footer>
  )
}