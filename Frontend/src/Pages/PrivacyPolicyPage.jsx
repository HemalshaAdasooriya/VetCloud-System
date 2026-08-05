import { Shield, Lock, Eye, FileText, CheckCircle2, Server, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "../layouts/navigation";
import Footer from "../layouts/footer";

export default function PrivacyPolicyPage() {
  const sections = [
    { id: "collection", title: "1. Information We Collect" },
    { id: "usage", title: "2. How We Use Your Information" },
    { id: "telehealth", title: "3. Telehealth & Medical Records Confidentiality" },
    { id: "security", title: "4. Data Security & Storage" },
    { id: "sharing", title: "5. Information Sharing & Third Parties" },
    { id: "rights", title: "6. Your Data Rights & Choices" },
    { id: "contact", title: "7. Contact Us Regarding Privacy" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-Inter">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-green-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
            <Shield className="w-4 h-4" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            VetCloud Privacy Policy
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
            Last Updated: August 2026 • Effective Date: January 1, 2026
          </p>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Quick Navigation Sidebar */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm sticky top-24">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                Table of Contents
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

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Lock className="w-4 h-4 text-green-600" />
                  <span>256-Bit SSL Encrypted Platform</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>GDPR & Veterinary Standard Compliant</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Detailed Policy Text */}
          <article className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-sm space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
            <div>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                At <strong>VetCloud System</strong>, we take your privacy and the confidentiality of your animal healthcare records with the utmost seriousness. This Privacy Policy details how we collect, use, encrypt, and safeguard information provided by pet owners, farmers, and veterinary medical professionals across our website and mobile application services.
              </p>
            </div>

            <hr className="border-slate-100" />

            {/* Section 1 */}
            <section id="collection" className="space-y-4 scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                1. Information We Collect
              </h2>
              <p>We collect information to provide seamless veterinary consultations and clinic mapping. This includes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Data:</strong> Full name, email address, contact phone number, user role (Pet Owner/Farmer or Veterinary Doctor), and password hashes.</li>
                <li><strong>Animal Health Records:</strong> Animal species, age, weight, symptoms history, past medical consultations, prescription notes, and uploaded photos/videos of health conditions.</li>
                <li><strong>Veterinary Credentials:</strong> License numbers, specializations, clinic addresses, and qualifications for verified doctors.</li>
                <li><strong>Technical & Location Data:</strong> IP address, device browser type, and geolocation (only when using the 'Find Clinic' map search feature).</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="usage" className="space-y-4 scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-green-600" />
                2. How We Use Your Information
              </h2>
              <p>Your information is used strictly to deliver veterinary care services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To connect pet owners and farmers with certified veterinary doctors for live teleconsultations.</li>
                <li>To maintain accurate electronic medical records (EMR) for your animals across lifetime care.</li>
                <li>To send consultation reminders, appointment confirmations, and critical security notifications (2FA verification).</li>
                <li>To improve disease database tracking and early detection of livestock epidemiological outbreaks.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="telehealth" className="space-y-4 scroll-mt-28 bg-green-50/60 p-6 rounded-2xl border border-green-200">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-600" />
                3. Telehealth & Medical Records Confidentiality
              </h2>
              <p className="text-slate-700">
                All communications between pet owners/farmers and veterinary doctors during live consultations (chat logs, shared images, diagnostic notes, and prescriptions) are protected under strict doctor-patient confidentiality. VetCloud staff members do not view private medical sessions except when requested by the account owner for technical dispute resolution.
              </p>
            </section>

            {/* Section 4 */}
            <section id="security" className="space-y-4 scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">4. Data Security & Storage</h2>
              <p>
                We implement industry-standard technical safeguards to protect your personal information against unauthorized access, loss, or alteration:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Data in transit is encrypted using 256-bit TLS (Transport Layer Security).</li>
                <li>Sensitive authentication credentials utilize salted cryptographic hashing algorithms.</li>
                <li>Account access supports optional Two-Factor Authentication (2FA).</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="sharing" className="space-y-4 scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">5. Information Sharing & Third Parties</h2>
              <p>
                We <strong>never sell or rent</strong> your personal or animal health data to third-party advertisers. Information is only shared under the following conditions:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>With Assigned Veterinarians:</strong> Necessary medical history is shared with the specific doctor conducting your consultation.</li>
                <li><strong>Service Providers:</strong> Secure infrastructure hosting (Supabase Storage, Google OAuth services) bound by confidentiality contracts.</li>
                <li><strong>Legal Requirements:</strong> If required by law, public health authorities, or court subpoenas.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="rights" className="space-y-4 scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">6. Your Data Rights & Choices</h2>
              <p>You maintain full control over your personal data on VetCloud:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You can access, edit, or update your profile details at any time in Account Settings.</li>
                <li>You may request a copy or complete deletion of your animal medical history records.</li>
                <li>You can opt out of promotional emails by clicking unsubscribe links.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="contact" className="space-y-4 scroll-mt-28 pt-4 border-t border-slate-100">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-green-600" />
                7. Contact Us Regarding Privacy
              </h2>
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy, please reach out to our Data Protection Officer:
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm">
                <p className="font-bold text-slate-900">VetCloud Privacy & Compliance Officer</p>
                <p className="text-slate-600">Email: privacy@vetcloud.com</p>
                <p className="text-slate-600">Direct Support: <Link to="/contact" className="text-green-600 hover:underline">Contact Support Form</Link></p>
              </div>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
