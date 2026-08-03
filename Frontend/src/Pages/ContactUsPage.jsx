import { useState } from "react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Headphones, 
  Stethoscope, 
  Building2 
} from "lucide-react";
import toast from "react-hot-toast";
import Navigation from "../layouts/navigation";
import Footer from "../layouts/footer";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success("Thank you! Your message has been sent to VetCloud support.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "General Inquiry",
        message: ""
      });
    }, 1000);
  };

  const contactCards = [
    {
      icon: Phone,
      title: "24/7 Support Hotline",
      details: "1-800-VET-CARE (1-800-838-2273)",
      subtext: "Toll-free, available 24 hours 7 days a week",
      color: "bg-green-50 text-green-600"
    },
    {
      icon: Mail,
      title: "Email Support",
      details: "support@vetcloud.com",
      subtext: "We usually respond within 2-4 hours",
      color: "bg-blue-50 text-blue-600"
    },
    {
      icon: Stethoscope,
      title: "Emergency Vet Care",
      details: "emergency@vetcloud.com",
      subtext: "Priority channel for urgent veterinary medical cases",
      color: "bg-amber-50 text-amber-600"
    },
    {
      icon: Building2,
      title: "Headquarters",
      details: "VetCloud Tech HQ, Colombo",
      subtext: "Main Administration & Operational Center, Sri Lanka",
      color: "bg-purple-50 text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-Inter">
      <Navigation />

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-green-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
            <Headphones className="w-4 h-4" />
            <span>We are here to help</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Contact VetCloud Support
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
            Have questions about animal care, online consultations, or clinic listings? Reach out to our team anytime.
          </p>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl space-y-16">
        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">{card.title}</h3>
                <p className="text-green-700 font-semibold text-sm mb-2">{card.details}</p>
              </div>
              <p className="text-slate-500 text-xs">{card.subtext}</p>
            </div>
          ))}
        </div>

        {/* Contact Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
          {/* Left info column */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                Send Us a Message
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-4 mb-3">
                Let's discuss how we can assist you
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Whether you are a pet owner needing medical guidance, a farmer managing livestock health, or a licensed veterinarian joining our network, we'd love to hear from you.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Operating Hours</h4>
                  <p className="text-xs text-slate-500">Online Consultations: 24/7/365</p>
                  <p className="text-xs text-slate-500">Admin Desk: Mon - Sat (8:00 AM - 6:00 PM)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Physical HQ</h4>
                  <p className="text-xs text-slate-500">VetCloud System Center, Technology Park</p>
                  <p className="text-xs text-slate-500">Colombo, Sri Lanka</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50/70 border border-green-200/80 rounded-2xl flex items-center gap-3 text-green-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-green-600" />
              <p className="text-xs font-medium">
                For urgent life-threatening animal emergencies, please call <strong className="underline">1-800-VET-CARE</strong> immediately.
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-green-50/40 rounded-2xl border border-green-200 space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Message Received!</h3>
                <p className="text-slate-600 text-sm max-w-md">
                  Thank you for reaching out. One of our support representatives will review your inquiry and get back to your email shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer mt-2"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +94 77 123 4567"
                      className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                      Inquiry Topic
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Online Consultation Help">Online Consultation Help</option>
                      <option value="Veterinary Doctor Partnership">Veterinary Doctor Partnership</option>
                      <option value="Technical & Account Support">Technical & Account Support</option>
                      <option value="Billing & Payments">Billing & Payments</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows="5"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your question or issue in detail..."
                    className="w-full p-4 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium text-base rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Sending Message..." : "Submit Inquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
