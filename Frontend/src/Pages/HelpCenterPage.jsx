import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  HelpCircle, 
  UserCheck, 
  Video, 
  Calendar, 
  Shield, 
  CreditCard, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  PhoneCall, 
  ArrowRight,
  BookOpen
} from "lucide-react";
import Navigation from "../layouts/navigation";
import Footer from "../layouts/footer";

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const categories = [
    {
      icon: UserCheck,
      title: "Getting Started",
      description: "Learn how to register, select your role, and complete profile verification.",
      articles: 5,
      color: "text-green-600 bg-green-50"
    },
    {
      icon: Video,
      title: "Online Consultations",
      description: "How to connect with certified vets, start video calls, and share medical history.",
      articles: 8,
      color: "text-blue-600 bg-blue-50"
    },
    {
      icon: Calendar,
      title: "Appointments & Clinics",
      description: "Booking physical clinic visits, viewing interactive maps, and scheduling times.",
      articles: 6,
      color: "text-purple-600 bg-purple-50"
    },
    {
      icon: Shield,
      title: "Account & 2FA Security",
      description: "Managing passwords, enabling two-factor authentication, and securing records.",
      articles: 4,
      color: "text-amber-600 bg-amber-50"
    },
    {
      icon: CreditCard,
      title: "Billing & Fees",
      description: "Understanding consultation fees, accepted payment methods, and invoice receipts.",
      articles: 5,
      color: "text-emerald-600 bg-emerald-50"
    },
    {
      icon: BookOpen,
      title: "Disease Database",
      description: "Browsing animal symptoms, prevention guides, and veterinary medical references.",
      articles: 7,
      color: "text-indigo-600 bg-indigo-50"
    }
  ];

  const faqs = [
    {
      question: "How do I consult a veterinarian on VetCloud?",
      answer: "Log into your farmer/pet owner account, select 'Consult a Vet' or click 'Book Appointment' from the dashboard, choose an available doctor, and initiate an emergency text/video consultation session."
    },
    {
      question: "What is Two-Factor Authentication (2FA) and how do I enable it?",
      answer: "2FA adds an extra layer of security to your VetCloud account. You can enable 2FA under your Profile Settings using any standard authenticator app like Google Authenticator or Microsoft Authenticator."
    },
    {
      question: "Can I find nearby physical veterinary clinics?",
      answer: "Yes! Visit the 'Find Clinic' page from the main menu to view an interactive map of registered veterinary clinics, view operating hours, and get driving directions."
    },
    {
      question: "How do I register as a Veterinary Doctor?",
      answer: "On the Sign Up page, select 'Veterinary Doctor' as your role. Fill out your professional license details, specialization, and contact information. Our administration team will verify your credentials within 24 hours."
    },
    {
      question: "What should I do in an immediate animal health emergency?",
      answer: "For severe critical emergencies requiring immediate surgery or physical intervention, call our 24/7 Hotline (1-800-VET-CARE) or locate the nearest emergency clinic on our map while starting an urgent video consultation."
    },
    {
      question: "How are consultation fees processed?",
      answer: "Consultation fees are displayed transparently prior to starting a session with a doctor. Payments are securely processed online via major cards and mobile payment solutions."
    }
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-Inter">
      <Navigation />

      {/* Hero Search Section */}
      <section className="bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-green-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
            <HelpCircle className="w-4 h-4" />
            <span>VetCloud Support Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            How can we help you today?
          </h1>
          <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            Search our knowledge base for instant answers regarding animal consultations, clinic appointments, and account security.
          </p>

          {/* Search Box */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for articles, guides, FAQs..."
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white text-slate-900 placeholder-slate-400 font-medium text-base shadow-2xl focus:outline-none focus:ring-4 focus:ring-green-500/30 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl space-y-16">
        {/* Support Categories */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Browse Help Topics</h2>
            <p className="text-slate-500 text-sm sm:text-base mt-2">Explore guides grouped by topic</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${cat.color}`}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-green-600 transition-colors mb-2">
                  {cat.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{cat.description}</p>
                <span className="inline-flex items-center text-xs font-semibold text-green-600 group-hover:underline">
                  {cat.articles} Articles <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs Accordion */}
        <section className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-sm max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-sm sm:text-base mt-2">Quick solutions to common questions</p>
          </div>

          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-xl overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-4 sm:p-5 text-left flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 font-semibold text-slate-800 text-base sm:text-lg transition-colors cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-4 sm:p-5 bg-white text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">
                No matching questions found for "{searchQuery}". Try another keyword or contact support.
              </div>
            )}
          </div>
        </section>

        {/* Still Need Help Banner */}
        <section className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-bold">Still have questions?</h3>
            <p className="text-green-100 text-sm sm:text-base max-w-xl">
              Can't find what you're looking for? Our dedicated veterinary support team is available 24/7 to assist you.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              to="/contact"
              className="bg-white text-green-700 hover:bg-green-50 font-semibold px-6 py-3 rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Contact Support
            </Link>
            <a
              href="tel:18008382273"
              className="bg-green-800/40 hover:bg-green-800/60 text-white border border-white/20 font-semibold px-6 py-3 rounded-xl transition-all text-center flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-5 h-5" />
              Call Hotline
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
