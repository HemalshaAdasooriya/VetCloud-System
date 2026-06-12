import { useEffect, useState, useCallback } from 'react';
import {
  User, Building2, Bell, Shield, Wallet,
  MapPin, Clock, Camera, Check, Upload, Save, CreditCard, Plus, Trash2, Building, Eye, EyeOff, Lock, Mail, RefreshCw, DollarSign, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Button, Card, Input } from '../components/Ui/ui';

// ─── Toast Component ─────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = type === 'error'
    ? 'bg-red-50 text-red-700 border border-red-200'
    : 'bg-green-50 text-green-700 border border-green-200';

  const Icon = type === 'error' ? AlertCircle : CheckCircle2;

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${styles} animate-in slide-in-from-bottom-4 duration-300`}>
      <Icon size={16} />
      {message}
    </div>
  );
}

export default function DoctorSettings() {

  const [activeTab, setActiveTab] = useState('profile');

  // ── Profile & Clinic State ──────────────────────────────────────────────
  const [payoutInfo, setPayoutInfo] = useState({
    bankName: '', accountName: '', accountNumber: '', branchCode: '', schedule: 'weekly'
  });
  const [clinicInfo, setClinicInfo] = useState({
    clinicName: '', clinicRegistrationNumber: '', address: '',
    city: '', state: '', zipCode: '', clinicPhone: ''
  });
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '', lastName: '', professional_title: '', specializations: '', bio: ''
  });
  const [fees, setFees] = useState({
    consultation_fee: '', videoFee: '', farmFee: '', emergencyFee: ''
  });

  // ── Loading / Toast ─────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // ── Payment Methods State ────────────────────────────────────────────────
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [pmLoading, setPmLoading] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentData, setNewPaymentData] = useState({
    bankName: '', accountName: '', accountNumber: '', branchCode: ''
  });

  // ── Payout Settings State ────────────────────────────────────────────────
  const [payoutSchedule, setPayoutSchedule] = useState('weekly');
  const [minPayout, setMinPayout] = useState('100');
  const [payoutNotifications, setPayoutNotifications] = useState({
    emailEnabled: true, smsEnabled: true
  });
  const [isSavingPayout, setIsSavingPayout] = useState(false);

  // ── Password State ───────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const tabs = [
    { id: 'profile', name: 'Personal Profile', icon: User },
    { id: 'clinic', name: 'Clinic Details', icon: Building2 },
    { id: 'security', name: 'Security & Login', icon: Shield },
    { id: 'billing', name: 'Billing & Payouts', icon: Wallet },
  ];

  // ─── Fetch Doctor Profile ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/profile`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setPersonalInfo({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            professional_title: data.professional_title || '',
            specializations: data.specialization || '',
            bio: data.bio || ''
          });
          setClinicInfo({
            clinicName: data.clinic_name || '',
            clinicRegistrationNumber: data.registration_number || '',
            address: data.clinic_address || '',
            city: data.clinic_city || '',
            state: data.clinic_state || '',
            zipCode: data.clinic_zip || '',
            clinicPhone: data.clinic_phone || ''
          });
          setPayoutInfo({
            bankName: data.bank_name || '',
            accountName: data.account_name || '',
            accountNumber: data.account_number || '',
            branchCode: data.branch_code || '',
            schedule: data.payout_schedule || 'weekly'
          });
          setPayoutSchedule(data.payout_schedule || 'weekly');
          setFees(prev => ({ ...prev, consultation_fee: data.consultation_fee || '' }));
        }
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctorProfile();
  }, []);

  // ─── Fetch Payment Methods ────────────────────────────────────────────────
  const fetchPaymentMethods = useCallback(async () => {
    setPmLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/payment-methods`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data);
      }
    } catch (err) {
      console.error("Failed to fetch payment methods:", err);
    } finally {
      setPmLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'billing') {
      fetchPaymentMethods();
    }
  }, [activeTab, fetchPaymentMethods]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(personalInfo)
      });
      if (res.ok) showToast("Profile updated successfully!");
      else { const d = await res.json(); showToast(d.message || "Failed to update profile", "error"); }
    } catch { showToast("Server connection failed", "error"); }
    finally { setIsSaving(false); }
  };

  const handleSaveClinic = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/clinic`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(clinicInfo)
      });
      if (res.ok) showToast("Clinic details saved!");
      else { const d = await res.json(); showToast(d.message || "Failed to save clinic details", "error"); }
    } catch { showToast("Server connection failed", "error"); }
    finally { setIsSaving(false); }
  };

  const handleUpdatePassword = async () => {
    setPasswordError(''); setPasswordSuccess('');
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Please fill in all password fields.'); return;
    }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters long.'); return; }
    if (newPassword !== confirmNewPassword) { setPasswordError('New passwords do not match.'); return; }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess(data.message || 'Password changed successfully!');
        setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else { setPasswordError(data.message || 'Failed to update password'); }
    } catch { setPasswordError("Server connection failed"); }
  };

  // ── Payment Methods ────────────────────────────────────────────────────────
  const handleAddPaymentMethod = async (e) => {
    if (e) e.preventDefault();
    const { bankName, accountName, accountNumber, branchCode } = newPaymentData;
    if (!bankName || !accountName || !accountNumber || !branchCode) {
      showToast("Please fill in all fields.", "error"); return;
    }
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/payment-methods`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(newPaymentData)
      });
      if (res.ok) {
        showToast("Payment method added successfully!");
        setShowAddPayment(false);
        setNewPaymentData({ bankName: '', accountName: '', accountNumber: '', branchCode: '' });
        await fetchPaymentMethods(); // Reload from DB
      } else {
        const d = await res.json();
        showToast(d.message || "Failed to save payment method.", "error");
      }
    } catch { showToast("Server connection failed", "error"); }
    finally { setIsSaving(false); }
  };

  const handleDeletePaymentMethod = async (methodId) => {
    if (!window.confirm("Remove this payment method?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/payment-methods/${methodId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Payment method removed.");
        setPaymentMethods(prev => prev.filter(m => m.id !== methodId));
      } else {
        showToast("Failed to remove payment method.", "error");
      }
    } catch { showToast("Server connection failed", "error"); }
  };

  // ── Payout Settings ────────────────────────────────────────────────────────
  const handleSavePayoutSettings = async () => {
    setIsSavingPayout(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        bankName: payoutInfo.bankName,
        accountName: payoutInfo.accountName,
        accountNumber: payoutInfo.accountNumber,
        branchCode: payoutInfo.branchCode,
        schedule: payoutSchedule
      };
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/payout-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) showToast("Payout settings saved!");
      else { const d = await res.json(); showToast(d.message || "Failed to save payout settings.", "error"); }
    } catch { showToast("Server connection failed", "error"); }
    finally { setIsSavingPayout(false); }
  };

  // ── Consultation Fees ──────────────────────────────────────────────────────
  const handleSaveFees = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/consultation-fees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(fees)
      });
      if (res.ok) showToast("Consultation fees updated!");
      else { const d = await res.json(); showToast(d.message || "Failed to save fees.", "error"); }
    } catch { showToast("Server connection failed", "error"); }
    finally { setIsSaving(false); }
  };

  // ── Helper: masked account number ─────────────────────────────────────────
  const maskAccount = (num) =>
    num && num.length > 4 ? `****${num.slice(-4)}` : num;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-800">Account Settings</h2>
        <p className="text-slate-500">Manage your profile, clinic details, and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation */}
        <Card className="md:col-span-1 p-2 border-slate-200 shadow-sm h-fit">
          <nav className="flex flex-col space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left
                  ${activeTab === tab.id
                    ? 'bg-green-50 text-green-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-green-600' : 'text-slate-400'} />
                {tab.name}
              </button>
            ))}
          </nav>
        </Card>

        <div className="md:col-span-3 space-y-6">

          {/* ── Personal Profile ───────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
              <h3 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">Personal Profile</h3>
              {isLoading ? (
                <p className="text-slate-500">Loading profile...</p>
              ) : (
                <form className="grid grid-cols-1 sm:grid-cols-2 gap-5" onSubmit={handleSaveProfile}>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">First Name</label>
                    <Input value={personalInfo.firstName} onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Last Name</label>
                    <Input value={personalInfo.lastName} onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Professional Title</label>
                    <Input value={personalInfo.professional_title} onChange={(e) => setPersonalInfo({ ...personalInfo, professional_title: e.target.value })} placeholder="e.g., DVM, MS - Senior Veterinarian" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Specializations (comma separated)</label>
                    <Input value={personalInfo.specializations} onChange={(e) => setPersonalInfo({ ...personalInfo, specializations: e.target.value })} placeholder="e.g., Large Animals, Equine Medicine" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Bio / About</label>
                    <textarea value={personalInfo.bio} onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
                      className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors resize-y"
                      placeholder="Tell us about your experience..." />
                  </div>
                  <div className="sm:col-span-2 flex justify-end pt-4">
                    <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
                      <Save size={16} className="mr-2" /> {isSaving ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          )}

          {/* ── Clinic Details ─────────────────────────────────────────────── */}
          {activeTab === 'clinic' && (
            <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
              <h3 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">Clinic Information</h3>
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-5" onSubmit={handleSaveClinic}>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Clinic Name</label>
                  <Input value={clinicInfo.clinicName} onChange={(e) => setClinicInfo({ ...clinicInfo, clinicName: e.target.value })} placeholder="e.g., Green Valley Veterinary Services" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Clinic Registration Number</label>
                  <Input value={clinicInfo.clinicRegistrationNumber} onChange={(e) => setClinicInfo({ ...clinicInfo, clinicRegistrationNumber: e.target.value })} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> Primary Address</label>
                  <Input value={clinicInfo.address} onChange={(e) => setClinicInfo({ ...clinicInfo, address: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">City</label>
                  <Input value={clinicInfo.city} onChange={(e) => setClinicInfo({ ...clinicInfo, city: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">State / Province</label>
                  <Input value={clinicInfo.state} onChange={(e) => setClinicInfo({ ...clinicInfo, state: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Zip / Postal Code</label>
                  <Input value={clinicInfo.zipCode} onChange={(e) => setClinicInfo({ ...clinicInfo, zipCode: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Clinic Phone</label>
                  <Input value={clinicInfo.clinicPhone} onChange={(e) => setClinicInfo({ ...clinicInfo, clinicPhone: e.target.value })} />
                </div>
                <div className="sm:col-span-2 flex justify-end pt-4">
                  <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
                    <Save size={16} className="mr-2" /> {isSaving ? "Saving..." : "Save Clinic Info"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* ── Security & Login ───────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <>
              <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
                <h3 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">Change Password</h3>
                {passwordError && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />{passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="mb-6 p-4 bg-green-50 text-green-600 text-sm font-medium rounded-xl border border-green-100 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />{passwordSuccess}
                  </div>
                )}
                <div className="space-y-5">
                  {[
                    { label: "Current Password", val: currentPassword, set: setCurrentPassword, show: showCurrentPassword, toggle: setShowCurrentPassword },
                    { label: "New Password", val: newPassword, set: setNewPassword, show: showNewPassword, toggle: setShowNewPassword, hint: "min. 8 characters" },
                    { label: "Confirm New Password", val: confirmNewPassword, set: setConfirmNewPassword, show: showConfirmPassword, toggle: setShowConfirmPassword }
                  ].map(({ label, val, set, show, toggle, hint }) => (
                    <div key={label} className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">{label}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div>
                        <Input type={show ? "text" : "password"} value={val} onChange={(e) => set(e.target.value)}
                          placeholder={hint ? `Enter ${label.toLowerCase()} (${hint})` : `Enter ${label.toLowerCase()}`}
                          className="pl-11 pr-11 h-11" />
                        <button type="button" onClick={() => toggle(!show)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs font-medium text-blue-800 mb-2">Password Requirements:</p>
                    <ul className="text-xs text-blue-700 space-y-1.5">
                      {[
                        [newPassword.length >= 8, "At least 8 characters long"],
                        [/[A-Z]/.test(newPassword), "Contains uppercase letter"],
                        [/[a-z]/.test(newPassword), "Contains lowercase letter"],
                        [/[0-9]/.test(newPassword), "Contains number"],
                        [/[!@#$%^&*(),.?":{}|<>]/.test(newPassword), "Contains special character"],
                      ].map(([ok, text]) => (
                        <li key={text} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-slate-300'}`} />{text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <Button onClick={handleUpdatePassword} className="bg-green-600 hover:bg-green-700 text-white">
                      <Lock size={16} className="mr-2" /> Update Password
                    </Button>
                  </div>
                </div>
              </Card>
              <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
                <h3 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">Login Information</h3>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                      <Input type="email" defaultValue="sarah.jenkins@vetcloud.com" className="pl-11 h-11" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">This email is used for login and account notifications.</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800 text-sm mb-1">Two-Factor Authentication</h4>
                        <p className="text-xs text-slate-600">Add an extra layer of security to your account.</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 text-xs">Enable 2FA</Button>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              BILLING & PAYOUTS TAB
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'billing' && (
            <>

              {/* ── 1. Payment Methods ───────────────────────────────────────── */}
              <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-semibold text-slate-800">Payment Methods</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchPaymentMethods}
                      title="Refresh"
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <RefreshCw size={15} className={pmLoading ? 'animate-spin' : ''} />
                    </button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowAddPayment(!showAddPayment);
                        setNewPaymentData({ bankName: '', accountName: '', accountNumber: '', branchCode: '' });
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white h-9"
                    >
                      <Plus size={16} className="mr-1" /> Add Method
                    </Button>
                  </div>
                </div>

                {/* Add Payment Form */}
                {showAddPayment && (
                  <div className="mb-6 p-5 bg-green-50 border border-green-100 rounded-xl">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Building size={16} className="text-green-600" /> New Bank Account
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Bank Name <span className="text-red-500">*</span></label>
                        <Input
                          value={newPaymentData.bankName}
                          onChange={(e) => setNewPaymentData({ ...newPaymentData, bankName: e.target.value })}
                          placeholder="e.g., Bank of Ceylon (BOC)"
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Account Holder Name <span className="text-red-500">*</span></label>
                        <Input
                          value={newPaymentData.accountName}
                          onChange={(e) => setNewPaymentData({ ...newPaymentData, accountName: e.target.value })}
                          placeholder="Full name as on bank account"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Account Number <span className="text-red-500">*</span></label>
                        <Input
                          value={newPaymentData.accountNumber}
                          onChange={(e) => setNewPaymentData({ ...newPaymentData, accountNumber: e.target.value })}
                          placeholder="e.g., 0012345678"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Branch Code / Name <span className="text-red-500">*</span></label>
                        <Input
                          value={newPaymentData.branchCode}
                          onChange={(e) => setNewPaymentData({ ...newPaymentData, branchCode: e.target.value })}
                          placeholder="e.g., 001 or Colombo Main"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4 pt-4 border-t border-green-200">
                      <Button size="sm" onClick={handleAddPaymentMethod} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
                        <Check size={15} className="mr-2" /> {isSaving ? "Saving..." : "Save Payment Method"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddPayment(false)} className="bg-white">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Primary payout account (from profile) */}
                {payoutInfo.bankName && (
                  <div className="mb-4 p-4 rounded-xl border border-green-200 bg-white flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                        <Building className="text-green-600" size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800">{payoutInfo.bankName}</p>
                          <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-md">Primary</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{payoutInfo.accountName} · {maskAccount(payoutInfo.accountNumber)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Saved Methods List */}
                {pmLoading ? (
                  <div className="flex items-center justify-center py-8 text-slate-400">
                    <RefreshCw size={18} className="animate-spin mr-2" /> Loading payment methods...
                  </div>
                ) : paymentMethods.length === 0 && !payoutInfo.bankName ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <CreditCard size={32} className="mb-2 opacity-40" />
                    <p className="text-sm">No payment methods added yet.</p>
                    <p className="text-xs mt-1">Click "Add Method" to add a bank account.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-green-200 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Building className="text-slate-500" size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{method.bank_name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{method.account_name} · {maskAccount(method.account_number)}</p>
                            {method.branch_code && <p className="text-xs text-slate-400">Branch: {method.branch_code}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* ── 2. Payout Settings ───────────────────────────────────────── */}
              <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
                <h3 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">Payout Settings</h3>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Payout Schedule */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Payout Schedule</label>
                      <select
                        value={payoutSchedule}
                        onChange={(e) => setPayoutSchedule(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly (Every Monday)</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    {/* Minimum Payout */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Minimum Payout Amount</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm font-medium">$</span>
                        <Input
                          type="number"
                          min="0"
                          value={minPayout}
                          onChange={(e) => setMinPayout(e.target.value)}
                          className="pl-7"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Current Balance panel */}
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl">
                    <h4 className="font-semibold text-blue-900 text-sm mb-3">Current Balance</h4>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-blue-900">$2,450.00</p>
                      <p className="text-sm text-blue-600">available for payout</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between text-sm">
                      <span className="text-blue-700">Next scheduled payout:</span>
                      <span className="font-semibold text-blue-900">Monday, June 16, 2026</span>
                    </div>
                  </div>

                  {/* Payout Notifications */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-800">Payout Notifications</h4>
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={payoutNotifications.emailEnabled}
                        onChange={(e) => setPayoutNotifications({ ...payoutNotifications, emailEnabled: e.target.checked })}
                        className="mt-0.5 w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500"
                      />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Email notifications for payouts</p>
                        <p className="text-xs text-slate-500 mt-0.5">Get notified when a payout is processed to your account.</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={payoutNotifications.smsEnabled}
                        onChange={(e) => setPayoutNotifications({ ...payoutNotifications, smsEnabled: e.target.checked })}
                        className="mt-0.5 w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500"
                      />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">SMS notifications for large payouts</p>
                        <p className="text-xs text-slate-500 mt-0.5">Receive SMS alerts for payouts exceeding $500.</p>
                      </div>
                    </label>
                  </div>

                  {/* Save Payout Settings Button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSavePayoutSettings}
                      disabled={isSavingPayout}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save size={16} className="mr-2" /> {isSavingPayout ? "Saving..." : "Save Payout Settings"}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* ── 3. Consultation Fees ─────────────────────────────────────── */}
              <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
                <h3 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">Consultation Fees</h3>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[
                      { label: "Online Consultation Fee", key: "consultation_fee", placeholder: "75" },
                      { label: "Video Consultation Fee", key: "videoFee", placeholder: "50" },
                      { label: "Farm Visit Fee (Base)", key: "farmFee", placeholder: "120" },
                      { label: "Emergency Consultation Fee", key: "emergencyFee", placeholder: "150" },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">{label}</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign size={14} className="text-slate-400" />
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={fees[key]}
                            onChange={(e) => setFees({ ...fees, [key]: e.target.value })}
                            placeholder={placeholder}
                            className="pl-7"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Platform fee notice */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800">
                      <strong>Platform Fee:</strong> VetCloud charges a <strong>10% platform fee</strong> on all consultations.
                      Farmers are charged the amounts above; you receive 90% after the platform fee is deducted.
                    </p>
                  </div>

                  {/* Fee preview */}
                  {fees.consultation_fee && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                      <p className="text-xs font-semibold text-green-800 mb-2">Earnings Preview (after 10% fee)</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "Online", val: fees.consultation_fee },
                          { label: "Video", val: fees.videoFee },
                          { label: "Farm Visit", val: fees.farmFee },
                          { label: "Emergency", val: fees.emergencyFee },
                        ].map(({ label, val }) => (
                          val ? (
                            <div key={label} className="bg-white rounded-lg p-2.5 border border-green-100 text-center">
                              <p className="text-xs text-slate-500">{label}</p>
                              <p className="text-sm font-bold text-green-700 mt-1">
                                ${(parseFloat(val) * 0.9).toFixed(2)}
                              </p>
                            </div>
                          ) : null
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSaveFees}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save size={16} className="mr-2" /> {isSaving ? "Saving..." : "Save Fee Settings"}
                    </Button>
                  </div>
                </div>
              </Card>

            </>
          )}

        </div>
      </div>
    </div>
  );
}