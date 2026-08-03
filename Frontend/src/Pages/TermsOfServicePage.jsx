import { FileText, AlertTriangle, Scale, ShieldCheck, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "../layouts/navigation";
import Footer from "../layouts/footer";

export default function TermsOfServicePage() {
  const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "disclaimer", title: "2. Telehealth & Emergency Disclaimer" },
    { id: "accounts", title: "3. Account Eligibility & Responsibilities" },
    { id: "doctors", title: "4. Veterinary Doctor Verification" },
    { id: "fees", title: "5. Consultation Fees & Cancellation Policy" },
    { id: "ip", title: "6. Intellectual Property & Content Rights" },
    { id: "liability", title: "7. Limitation of Liability" },
    { id: "governing", title: "8. Termination & Governing Law" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-Inter">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-green-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
            <Scale className="w-4 h-4" />
            <span>User Agreement & Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            VetCloud Terms of Service
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
            Last Updated: August 2026 • Please read these terms carefully before using VetCloud.
          </p>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm sticky top-24">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                Terms Index
              </h3>
              <nav className="space-y-2 text-xs sm:text-sm">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block p-2.5 rounded-xl text-slate-600 hover:text-green-700 hover:bg-green-50/60 transition-colors font-medium"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Detailed Terms Document */}
          <article className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
            <div>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Welcome to <strong>VetCloud System</strong>. These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "Farmer", "Pet Owner", or "Veterinary Professional") and VetCloud regarding your access to and use of the VetCloud website, applications, and digital veterinary consultation platform.
              </p>
            </div>

            <hr className="border-slate-100" />

            {/* Emergency Disclaimer Alert Box */}
            <div id="disclaimer" className="bg-amber-50/90 border border-amber-300 rounded-2xl p-6 space-y-3 text-amber-900 scroll-mt-28">
              <div className="flex items-center gap-2 font-bold text-base text-amber-950">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>IMPORTANT VETERINARY TELEHEALTH DISCLAIMER</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">
                VetCloud connects animal owners with certified veterinary doctors for online consultation, triage, and guidance. <strong>VetCloud online services are NOT intended to replace physical emergency surgery or hands-on critical resuscitation.</strong> If an animal is experiencing life-threatening trauma, severe bleeding, or respiratory distress, please call our emergency line (<Link to="/contact" className="underline font-bold">1-800-VET-CARE</Link>) or transport the animal immediately to the nearest physical veterinary hospital.
              </p>
            </div>

            {/* Section 1 */}
            <section id="acceptance" className="space-y-4 scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">1. Acceptance of Terms</h2>
              <p>
                By creating an account, accessing, or using any feature of VetCloud, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must discontinue platform use immediately.
              </p>
            </section>

            {/* Section 3 */}
            <section id="accounts" className="space-y-4 scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">3. Account Eligibility & Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years of age to register an account and book paid consultations.</li>
                <li>You are responsible for maintaining the confidentiality of your login credentials and 2FA authentication codes.</li>
                <li>You agree to provide accurate, up-to-date information regarding your identity and animal health history.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="doctors" className="space-y-4 scroll-mt-28 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                4. Veterinary Doctor Verification & Professional Autonomy
              </h2>
              <p className="text-slate-700">
                All veterinary practitioners on VetCloud undergo credential verification, including license validation by governing veterinary medical councils. Veterinarians act as independent licensed professionals and exercise sole medical judgment during consultations.
              </p>
            </section>

            {/* Section 5 */}
            <section id="fees" className="space-y-4 scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">5. Consultation Fees & Cancellation Policy</h2>
              <p>
                Consultation fees are disclosed prior to starting an appointment. Payments are processed securely at the time of booking. Cancellations made at least 1 hour prior to scheduled appointments are eligible for full refunds.
              </p>
            </section>

            {/* Section 6 */}
            <section id="ip" className="space-y-4 scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">6. Intellectual Property & Content Rights</h2>
              <p>
                All trademarks, disease database articles, design assets, and logos associated with VetCloud are protected under intellectual property laws. Users may not copy or redistribute system content without express authorization.
              </p>
            </section>

            {/* Section 7 */}
            <section id="liability" className="space-y-4 scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">7. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, VetCloud shall not be liable for indirect, incidental, or consequential damages resulting from platform downtime, delayed internet connectivity during consultations, or incorrect information provided by animal owners.
              </p>
            </section>

            {/* Section 8 */}
            <section id="governing" className="space-y-4 scroll-mt-28 pt-4 border-t border-slate-100">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-green-600" />
                8. Termination & Governing Law
              </h2>
              <p>
                These Terms are governed by the laws of Sri Lanka. VetCloud reserves the right to suspend or terminate accounts that violate system policies or misuse veterinary services.
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm mt-4">
                <p className="font-bold text-slate-900">Questions about our Terms?</p>
                <p className="text-slate-600">Contact our Legal & Support Desk: legal@vetcloud.com</p>
              </div>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
