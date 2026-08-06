import { useEffect, useState, useCallback } from 'react';
import {
  User, Building2, Bell, Shield, Wallet,
  MapPin, Clock, Camera, Check, Upload, Save, CreditCard, Plus, Trash2, Building, Eye, EyeOff, Lock, Mail, RefreshCw, DollarSign, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Button, Card, Input } from '../components/Ui/ui';

// Toast Component 
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

  // Login Info State 
  const [loginInfo, setLoginInfo] = useState({
    email: '',
    is2FAEnabled: false
  }); 

  // ── 2FA Modal State 
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  const [activeTab, setActiveTab] = useState('profile');

  // ── Profile & Clinic State 
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
  const [commissionPct, setCommissionPct] = useState(10);

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

  const getNextPayoutDate = (schedule) => {
    const today = new Date();
    if (schedule === 'daily') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (schedule === 'weekly') {
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
      return nextMonday.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (schedule === 'biweekly') {
      const nextFortnight = new Date(today);
      nextFortnight.setDate(today.getDate() + 14);
      return nextFortnight.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    // monthly
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const tabs = [
    { id: 'profile', name: 'Personal Profile', icon: User },
    { id: 'clinic', name: 'Clinic Details', icon: Building2 },
    { id: 'security', name: 'Security & Login', icon: Shield },
    { id: 'billing', name: 'Consultation Fees', icon: Wallet },
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
          let savedUser = {};
          try {
            savedUser = JSON.parse(localStorage.getItem("user") || "{}");
          } catch (e) {
            console.error(e);
          }

          let fName = data.firstName || '';
          let lName = data.lastName || '';
          if (!fName && !lName && (data.fullName || savedUser.fullName)) {
            const nameToSplit = data.fullName || savedUser.fullName;
            const parts = nameToSplit.trim().split(" ");
            fName = parts[0] || '';
            lName = parts.slice(1).join(" ") || '';
          }

          setLoginInfo({
            email: data.email || savedUser.email || '',
            is2FAEnabled: Boolean(data.is_two_factor_enabled)
          });
          const specFromDB = data.specialization || savedUser.specialization || '';
          const options = [
            "Livestock & Large Animals", "Small Pets", "Small Pets (Dogs, Cats)", "Poultry", 
            "Exotic Animals", "Aquatic Animals", "Veterinary Surgery", 
            "Veterinary Dermatology", "Veterinary Cardiology", 
            "Veterinary Ophthalmology", "Veterinary Oncology", "Veterinary Reproduction"
          ];

          let matchedSpec = specFromDB;
          if (specFromDB) {
            const found = options.find(opt => opt.toLowerCase() === specFromDB.toLowerCase() || opt.toLowerCase().includes(specFromDB.toLowerCase()) || specFromDB.toLowerCase().includes(opt.toLowerCase()));
            if (found) matchedSpec = found;
          }

          setPersonalInfo({
            firstName: fName,
            lastName: lName,
            professional_title: data.professional_title || '',
            specializations: matchedSpec,
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
            schedule: data.payout_schedule || 'weekly',
            current_balance: data.current_balance || 0,
            minimum_payout: data.minimum_payout || 1000
          });
          setPayoutSchedule(data.payout_schedule || 'weekly');
          setMinPayout(data.minimum_payout || '1000');
          setFees(prev => ({ ...prev, consultation_fee: data.consultation_fee || '' }));
        }

        // Fetch dynamic platform commission
        const commissionRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/commission`);
        if (commissionRes.ok) {
          const commissionData = await commissionRes.json();
          if (commissionData.commission_percentage) {
            setCommissionPct(parseFloat(commissionData.commission_percentage));
          }
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
    
    // Clinic Phone validation: must be exactly 10 digits
    const phoneClean = (clinicInfo.clinicPhone || '').trim();
    if (phoneClean && (!/^\d+$/.test(phoneClean) || phoneClean.length !== 10)) {
      showToast("Clinic phone number must be exactly 10 digits (e.g. 0712345678).", "error");
      return;
    }

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
        schedule: payoutSchedule,
        minimumPayout: minPayout
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

  // ── 2FA Handlers ─────────────────────────────────────────────────────────
  const handleInitiate2FA = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/generate-2fa`);
      if (res.ok) {
        const data = await res.json();
        setQrCodeUrl(data.qrCodeUrl);
        setTwoFactorSecret(data.secret);
        setShow2FAModal(true); // Open the modal
      } else {
        showToast("Failed to generate 2FA QR code", "error");
      }
    } catch {
      showToast("Server connection failed", "error");
    }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      showToast("Please enter a 6-digit code", "error");
      return;
    }
    
    setIsVerifying2FA(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/verify-2fa`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ token: verificationCode, secret: twoFactorSecret })
      });

      if (res.ok) {
        showToast("Two-Factor Authentication Enabled Successfully!");
        setLoginInfo(prev => ({ ...prev, is2FAEnabled: true }));
        setShow2FAModal(false);
        setVerificationCode('');
      } else {
        showToast("Invalid verification code. Try again.", "error");
      }
    } catch {
      showToast("Server connection failed", "error");
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm("Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.")) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/disable-2fa`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        showToast("Two-Factor Authentication Disabled");
        setLoginInfo(prev => ({ ...prev, is2FAEnabled: false }));
      } else {
        showToast("Failed to disable 2FA", "error");
      }
    } catch {
      showToast("Server connection failed", "error");
    }
  };


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
                    <label className="text-sm font-medium text-slate-700">Specialization</label>
                    <select 
                      value={personalInfo.specializations} 
                      onChange={(e) => setPersonalInfo({ ...personalInfo, specializations: e.target.value })} 
                      className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors cursor-pointer"
                    >
                      <option value="">Select Specialization</option>
                      <option value="Livestock & Large Animals">Livestock & Large Animals</option>
                      <option value="Small Pets">Small Pets (Dogs, Cats)</option>
                      <option value="Poultry">Poultry</option>
                      <option value="Exotic Animals">Exotic Animals</option>
                      <option value="Aquatic Animals">Aquatic Animals</option>
                      <option value="Veterinary Surgery">Veterinary Surgery</option>
                      <option value="Veterinary Dermatology">Veterinary Dermatology</option>
                      <option value="Veterinary Cardiology">Veterinary Cardiology</option>
                      <option value="Veterinary Ophthalmology">Veterinary Ophthalmology</option>
                      <option value="Veterinary Oncology">Veterinary Oncology</option>
                      <option value="Veterinary Reproduction">Veterinary Reproduction</option>
                    </select>
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
                  <Input 
                    type="text"
                    placeholder="e.g., 10100"
                    maxLength={10}
                    value={clinicInfo.zipCode} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setClinicInfo({ ...clinicInfo, zipCode: val });
                    }} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Clinic Phone</label>
                  <Input 
                    type="tel"
                    maxLength={10}
                    placeholder="0712345678" 
                    value={clinicInfo.clinicPhone} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setClinicInfo({ ...clinicInfo, clinicPhone: val });
                    }} 
                  />
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
              {/* login information */}
              <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
                <h3 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">Login Information</h3>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                      <Input 
                        type="email" 
                        value={loginInfo.email} 
                        readOnly // Email should be read-only here unless you build an email verification change flow
                        className="pl-11 h-11 bg-slate-50 text-slate-500 cursor-not-allowed" 
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">This email is used for login and account notifications.</p>
                  </div>
                  
                  <div className={`p-4 border rounded-lg ${loginInfo.is2FAEnabled ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800 text-sm mb-1 flex items-center gap-2">
                          Two-Factor Authentication 
                          {loginInfo.is2FAEnabled && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase">Enabled</span>}
                        </h4>
                        <p className="text-xs text-slate-600">
                          {loginInfo.is2FAEnabled 
                            ? "Your account is secured with two-factor authentication." 
                            : "Add an extra layer of security to your account."}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant={loginInfo.is2FAEnabled ? "destructive" : "outline"} 
                        onClick={loginInfo.is2FAEnabled ? handleDisable2FA : handleInitiate2FA} /* Add this line! */
                        className={`h-8 text-xs ${loginInfo.is2FAEnabled ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200 hover:text-red-700 border' : ''}`}
                      >
                        {loginInfo.is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                      </Button>
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
              {/* ── Consultation Fees ─────────────────────────────────────── */}
              <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
                <h3 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">Consultation Fee</h3>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Standard Consultation Fee</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-semibold text-slate-400">
                        Rs.
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fees.consultation_fee}
                        onChange={(e) => setFees({ ...fees, consultation_fee: e.target.value })}
                        placeholder="e.g., 1500.00"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Platform fee notice */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800">
                      <strong>Platform Fee:</strong> VetCloud charges a <strong>{commissionPct}% platform fee</strong> on all consultations.
                      Farmers are charged the amount above; you receive {100 - commissionPct}% after the platform fee is deducted.
                    </p>
                  </div>

                  {/* Fee preview */}
                  {fees.consultation_fee && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                      <p className="text-xs font-semibold text-green-800 mb-2">Earnings Preview (after {commissionPct}% fee)</p>
                      <div className="bg-white rounded-lg p-3 border border-green-100 text-center max-w-xs">
                        <p className="text-xs text-slate-500">Net Earning per Consultation</p>
                        <p className="text-lg font-bold text-green-700 mt-1">
                          LKR {(parseFloat(fees.consultation_fee) * (1 - commissionPct / 100)).toFixed(2)}
                        </p>
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


      {/* ── 2FA Setup Modal ────────────────────────────────────────────── */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Setup Two-Factor Authentication</h3>
              <p className="text-sm text-slate-500 mb-6">
                Scan this QR code with an authenticator app (like Google Authenticator or Authy), then enter the 6-digit code below.
              </p>
              
              <div className="flex justify-center mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">Loading...</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Verification Code</label>
                <Input 
                  type="text" 
                  maxLength="6"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest h-14 font-bold"
                />
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShow2FAModal(false); setVerificationCode(''); }} className="bg-white">
                Cancel
              </Button>
              <Button onClick={handleVerify2FA} disabled={isVerifying2FA || verificationCode.length !== 6} className="bg-green-600 hover:bg-green-700 text-white">
                {isVerifying2FA ? "Verifying..." : "Verify & Enable"}
              </Button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}