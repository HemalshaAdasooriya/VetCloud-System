import { useEffect, useState } from 'react';
import {
  User, Building2, Bell, Shield, Wallet,
  MapPin, Clock, Camera, Check, Upload, Save, CreditCard, Plus, Trash2, Building, Eye, EyeOff, Lock, Mail
} from 'lucide-react';
import { Button, Card, Input } from '../components/Ui/ui';




export default function DoctorSettings() {

    const [activeTab, setActiveTab] = useState('profile');
    const [payoutInfo, setPayoutInfo] = useState({
        bankName: '',
        accountName: '',
        accountNumber: '',
        branchCode: '',
        schedule: 'weekly'
    });
    const [clinicInfo, setClinicInfo] = useState({
        clinicName: '',
        clinicRegistrationNumber: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        clinicPhone: ''
    });
    const [personalInfo, setPersonalInfo] = useState({
        firstName: '',
        lastName: '',
        professional_title: '',
        specializations: '',
        bio: ''
    });
    const [fees, setFees] = useState({
        consultation_fee: '', 
        videoFee: '',
        farmFee: '',
        emergencyFee: ''
    });

    const [isLoading, setIsLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState(null);

    const [paymentMethods, setPaymentMethods] = useState([]);
    const [showAddPayment, setShowAddPayment] = useState(false);

    const [newPaymentData, setNewPaymentData] = useState({
        bankName: '',
        accountName: '',
        accountNumber: '',
        branchCode: ''
    });

    // Password change state
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

    useEffect(() => {
        const fetchDoctorProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    console.error("No token found");
                    return;
                }

                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/profile`, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // Map the backend data to your state
                    setPersonalInfo({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        professional_title: data.professional_title || '', 
                        specializations: data.specialization || '', // Mapped from your registration fields
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
                    setFees(prevFees => ({
                        ...prevFees,
                        consultation_fee: data.consultation_fee || ''
                    }));
                } else {
                    console.error("Failed to fetch profile");
                }
            } catch (error) {
                console.error("Error fetching doctor profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDoctorProfile();
    }, []);

    // 3. Save updated profile data
    const handleSaveProfile = async (e) => {
        if (e) e.preventDefault();
        
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(personalInfo)
            });

            if (response.ok) {
                setToastMessage("Profile updated successfully!");
                // Optionally clear the toast after 3 seconds
                setTimeout(() => setToastMessage(null), 3000);
            } else {
                const errorData = await response.json();
                setToastMessage(errorData.message || "Failed to update profile");
            }
        } catch (error) {
            console.error("Save error:", error);
            setToastMessage("Server connection failed");
        }
    };

    // Function to save Clinic Details
    const handleSaveClinic = async (e) => {
        if (e) e.preventDefault(); // Stop the page from refreshing
        setIsLoading(true);
        
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            // Send the crate to the backend desk we built earlier
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/clinic`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(clinicInfo) // Attach the memory bank
            });

            if (response.ok) {
                setToastMessage("Clinic details saved successfully!");
                setTimeout(() => setToastMessage(null), 3000);
            } else {
                const errorData = await response.json();
                setToastMessage(errorData.message || "Failed to save clinic details");
            }
        } catch (error) {
            console.error("Save error:", error);
            setToastMessage("Server connection failed");
        } finally {
            setIsLoading(false);
        }
    };

    
    const handleUpdatePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Frontend Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        setPasswordError('Please fill in all password fields.');
        return;
    }
    if (newPassword.length < 8) {
        setPasswordError('New password must be at least 8 characters long.');
        return;
    }
    if (newPassword !== confirmNewPassword) {
        setPasswordError('New passwords do not match.');
        return;
    }

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            setPasswordSuccess(data.message || 'Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setTimeout(() => setPasswordSuccess(''), 3000);
        } else {
            setPasswordError(data.message || 'Failed to update password');
        }
    } catch (error) {
        console.error("Password change error:", error);
        setPasswordError("Server connection failed");
    }
};


const handleAddPaymentMethod = async (e) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        
        try {
            const token = localStorage.getItem("token");
            const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/payout-settings`;
            
            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                // Send the correct data (newPaymentData) to the backend!
                body: JSON.stringify({
                    bankName: newPaymentData.bankName,
                    accountName: newPaymentData.accountName,
                    accountNumber: newPaymentData.accountNumber,
                    branchCode: newPaymentData.branchCode,
                    schedule: 'weekly'
                })
            });

            if (response.ok) {
                setToastMessage("Payment method saved successfully!");
                
                // 1. Add it to the visual list on the frontend
                const newMethod = {
                    id: Date.now(),
                    type: 'bank',
                    name: `${newPaymentData.bankName} - ${newPaymentData.accountName}`,
                    accountNumber: newPaymentData.accountNumber,
                    isPrimary: paymentMethods.length === 0
                };
                setPaymentMethods([...paymentMethods, newMethod]);

                // 2. Close the window and completely empty the input boxes
                setShowAddPayment(false);
                setNewPaymentData({ bankName: '', accountName: '', accountNumber: '', branchCode: '' });

                setTimeout(() => setToastMessage(null), 3000);
            } else {
                const errorData = await response.json();
                setToastMessage(errorData.message || "Failed to save payment method.");
            }
        } catch  {
            setToastMessage("Server connection failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Account Settings</h2>
        <p className="text-slate-500">Manage your profile, clinic details, and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <Card className="md:col-span-1 p-2 border-slate-200 shadow-sm h-fit">
          <nav className="flex flex-col space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left
                  ${activeTab === tab.id 
                    ? 'bg-green-50 text-green-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-green-600' : 'text-slate-400'} />
                {tab.name}
              </button>
            ))}
          </nav>
        </Card>

        {/* Settings Content */}
        <div className="md:col-span-3 space-y-6">
          
            {/* Profile Settings */}
            {activeTab === 'profile' && (
            <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
                <h3 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">Personal Profile</h3>
                
                {toastMessage && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                    {toastMessage}
                </div>
                )}

                {/* ... Profile Picture Section remains the same ... */}

                {isLoading ? (
                    <p className="text-slate-500">Loading profile...</p>
                ) : (
                    <form className="grid grid-cols-1 sm:grid-cols-2 gap-5" onSubmit={handleSaveProfile}>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">First Name</label>
                        <Input 
                            value={personalInfo.firstName} 
                            onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Last Name</label>
                        <Input 
                            value={personalInfo.lastName}
                            onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Professional Title</label>
                        <Input 
                            value={personalInfo.professional_title}
                            onChange={(e) => setPersonalInfo({...personalInfo, professional_title: e.target.value})}
                            placeholder="e.g., DVM, MS - Senior Veterinarian" 
                        />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Specializations (comma separated)</label>
                        <Input 
                            value={personalInfo.specializations}
                            onChange={(e) => setPersonalInfo({...personalInfo, specializations: e.target.value})}
                            placeholder="e.g., Large Animals, Equine Medicine" 
                        />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Bio / About</label>
                        <textarea 
                        value={personalInfo.bio}
                        onChange={(e) => setPersonalInfo({...personalInfo, bio: e.target.value})}
                        className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors resize-y"
                        placeholder="Tell us about your experience..."
                        />
                    </div>
                    
                    <div className="sm:col-span-2 flex justify-end pt-4">
                        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                            <Save size={16} className="mr-2" /> Save Profile
                        </Button>
                    </div>
                    </form>
                )}
            </Card>
            )}

          
          {/* Clinic Details */}
          {activeTab === 'clinic' && (
            <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
              <h3 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">Clinic Information</h3>
              
              {toastMessage && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                    {toastMessage}
                </div>
              )}

              {/* 🔍 FIX: Wrap in a form and attach the save function */}
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-5" onSubmit={handleSaveClinic}>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Clinic Name</label>
                  {/* 🔍 FIX: Bind value and onChange to the state */}
                  <Input 
                    value={clinicInfo.clinicName} 
                    onChange={(e) => setClinicInfo({...clinicInfo, clinicName: e.target.value})} 
                    placeholder="e.g., Green Valley Veterinary Services"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Clinic Registration Number</label>
                  <Input 
                    value={clinicInfo.clinicRegistrationNumber} 
                    onChange={(e) => setClinicInfo({...clinicInfo, clinicRegistrationNumber: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400"/> Primary Address
                  </label>
                  <Input 
                    value={clinicInfo.address} 
                    onChange={(e) => setClinicInfo({...clinicInfo, address: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">City</label>
                  <Input 
                    value={clinicInfo.city} 
                    onChange={(e) => setClinicInfo({...clinicInfo, city: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">State / Province</label>
                  <Input 
                    value={clinicInfo.state} 
                    onChange={(e) => setClinicInfo({...clinicInfo, state: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Zip / Postal Code</label>
                  <Input 
                    value={clinicInfo.zipCode} 
                    onChange={(e) => setClinicInfo({...clinicInfo, zipCode: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Clinic Phone</label>
                  <Input 
                    value={clinicInfo.clinicPhone} 
                    onChange={(e) => setClinicInfo({...clinicInfo, clinicPhone: e.target.value})} 
                  />
                </div>
                
                {/* 🔍 FIX: Add a specific submit button for this form */}
                <div className="sm:col-span-2 flex justify-end pt-4">
                    <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                        <Save size={16} className="mr-2" /> {isLoading ? "Saving..." : "Save Clinic Info"}
                    </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Security & Login */}
          {activeTab === 'security' && (
            <>
              <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
                <h3 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">Change Password</h3>

                {passwordError && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="mb-6 p-4 bg-green-50 text-green-600 text-sm font-medium rounded-xl border border-green-100 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {passwordSuccess}
                  </div>
                )}

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Current Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="pl-11 pr-11 h-11 rounded-lg border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min. 8 characters)"
                        className="pl-11 pr-11 h-11 rounded-lg border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="pl-11 pr-11 h-11 rounded-lg border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs font-medium text-blue-800 mb-2">Password Requirements:</p>
                    <ul className="text-xs text-blue-700 space-y-1.5">
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-slate-300'}`} />
                        At least 8 characters long
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-300'}`} />
                        Contains uppercase letter
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-300'}`} />
                        Contains lowercase letter
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-300'}`} />
                        Contains number
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-300'}`} />
                        Contains special character
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    {/* <Button
                      onClick={() => {
                        setPasswordError('');
                        setPasswordSuccess('');

                        if (!currentPassword || !newPassword || !confirmNewPassword) {
                          setPasswordError('Please fill in all password fields.');
                          return;
                        }
                        if (newPassword.length < 8) {
                          setPasswordError('New password must be at least 8 characters long.');
                          return;
                        }
                        if (newPassword !== confirmNewPassword) {
                          setPasswordError('New passwords do not match.');
                          return;
                        }

                        setPasswordSuccess('Password changed successfully!');
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setTimeout(() => setPasswordSuccess(''), 5000);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Lock size={16} className="mr-2" /> Update Password
                    </Button> */}
                    <Button
                        onClick={handleUpdatePassword}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
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
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <Input
                        type="email"
                        defaultValue="sarah.jenkins@vetcloud.com"
                        className="pl-11 h-11 rounded-lg border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">This email is used for login and account notifications.</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800 text-sm mb-1">Two-Factor Authentication</h4>
                        <p className="text-xs text-slate-600">Add an extra layer of security to your account.</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        Enable 2FA
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-medium text-slate-800 mb-3">Active Sessions</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-800">Current Device - Chrome on Windows</p>
                          <p className="text-xs text-slate-500 mt-0.5">Last active: Just now</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Active</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-800">iPhone - Safari</p>
                          <p className="text-xs text-slate-500 mt-0.5">Last active: 2 hours ago</p>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:bg-red-50">
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Billing & Payment Options */}
          {activeTab === 'billing' && (
            <>
              <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-semibold text-slate-800">Payment Methods</h3>
                  <Button
                      size="sm"
                      // UPDATE THIS ONCLICK:
                      onClick={() => {
                          setShowAddPayment(!showAddPayment);
                          setNewPaymentData({ bankName: '', accountName: '', accountNumber: '', branchCode: '' });
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white h-9"
                  >
                      <Plus size={16} className="mr-1" /> Add Payment Method
                  </Button>
                </div>

                {toastMessage && (
                  <div className={`mb-4 p-3 rounded-md text-sm ${toastMessage.includes("Failed") ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                      {toastMessage}
                  </div>
              )}

              {/* Visual Display of Saved Bank Details */}
              {payoutInfo.bankName && (
                  <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                              <Building className="text-green-600" size={24} />
                          </div>
                          <div>
                              <div className="flex items-center gap-3">
                                  <p className="font-semibold text-slate-800">
                                      {payoutInfo.bankName} - {payoutInfo.accountName}
                                  </p>
                                  <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-md">
                                      Primary
                                  </span>
                              </div>
                              <p className="text-sm text-slate-500 mt-1">
                                  {/* This creates the ****1234 masked effect */}
                                  {payoutInfo.accountNumber.length > 4 
                                      ? `****${payoutInfo.accountNumber.slice(-4)}` 
                                      : payoutInfo.accountNumber}
                              </p>
                          </div>
                      </div>
                  </div>
              )}

                {/* Add Payment Form */}
                {showAddPayment && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl">
                    <h4 className="font-medium text-slate-800 mb-4">Add New Payment Method</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Payment Type</label>
                        <select className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500">
                          <option value="">Select payment type</option>
                          <option value="Card Payments">Card Payments</option>
                          <option value="Mobile">Mobile Wallets & Apps</option>
                          <option value="HelaPay">HelaPay</option>
                          <option value="Paypal">Paypal</option>
                        </select>
                      </div> */}
                      <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-sm font-medium text-slate-700">Bank Name</label>
                          <Input 
                              value={newPaymentData.bankName} 
                              onChange={(e) => setNewPaymentData({...newPaymentData, bankName: e.target.value})} 
                              placeholder="e.g., Bank of Ceylon (BOC)"
                              required
                          />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-sm font-medium text-slate-700">Account Holder Name</label>
                          <Input 
                              value={newPaymentData.accountName} 
                              onChange={(e) => setNewPaymentData({...newPaymentData, accountName: e.target.value})} 
                              required
                          />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">Account Number</label>
                          <Input 
                              value={newPaymentData.accountNumber} 
                              onChange={(e) => setNewPaymentData({...newPaymentData, accountNumber: e.target.value})} 
                              required
                          />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700">Branch Code / Name</label>
                          <Input 
                              value={newPaymentData.branchCode} 
                              onChange={(e) => setNewPaymentData({...newPaymentData, branchCode: e.target.value})} 
                              required
                          />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-sm font-medium text-slate-700">Payout Schedule</label>
                          {/* 2. Bind the select dropdown to our state */}
                          <select 
                              value={payoutInfo.schedule}
                              onChange={(e) => setPayoutInfo({...payoutInfo, schedule: e.target.value})}
                              className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                          >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly (Every Monday)</option>
                              <option value="biweekly">Bi-weekly</option>
                              <option value="monthly">Monthly</option>
                          </select>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4 pt-4 border-t border-green-200">
                      <Button
                        size="sm"
                        type="submit"
                        onClick={handleAddPaymentMethod}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check size={16} className="mr-2" /> {isLoading ? "Saving..." : "Save Payout Settings"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddPayment(false)}
                        className="bg-white"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Saved Payment Methods */}
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-green-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                          {method.type === 'bank' ? (
                            <Building className="text-green-600" size={24} />
                          ) : (
                            <CreditCard className="text-green-600" size={24} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-800">{method.name}</p>
                            {method.isPrimary && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">{method.accountNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.isPrimary && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                          >
                            Set as Primary
                          </Button>
                        )}
                        <button className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Payout Settings */}
              <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
                <h3 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">Payout Settings</h3>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Payout Schedule</label>
                      <select defaultValue="weekly" className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly (Every Monday)</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Minimum Payout Amount</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">$</span>
                        <Input defaultValue="100" className="pl-7" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="font-medium text-blue-900 text-sm mb-2">Current Balance</h4>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-blue-900">$2,450.00</p>
                      <p className="text-sm text-blue-700">Available for payout</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700">Next scheduled payout:</span>
                        <span className="font-medium text-blue-900">Monday, April 14, 2026</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-800">Payout Notifications</h4>
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="mt-0.5">
                        <input type="checkbox" className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500" defaultChecked />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Email notifications for payouts</p>
                        <p className="text-xs text-slate-500 mt-0.5">Get notified when a payout is processed to your account.</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="mt-0.5">
                        <input type="checkbox" className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500" defaultChecked />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">SMS notifications for large payouts</p>
                        <p className="text-xs text-slate-500 mt-0.5">Receive SMS alerts for payouts exceeding $500.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </Card>

              {/* Consultation Fees */}
              <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in">
                <h3 className="text-lg font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-3">Consultation Fees</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Video Consultation Fee</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">$</span>
                        <Input defaultValue="50" className="pl-7" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">In-Clinic Visit Fee</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">$</span>
                        <Input defaultValue="75" className="pl-7" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Farm Visit Fee (Base)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">$</span>
                        <Input defaultValue="120" className="pl-7" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Emergency Consultation Fee</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">$</span>
                        <Input defaultValue="150" className="pl-7" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-600">
                      <strong>Platform Fee:</strong> VetCloud charges a 10% platform fee on all consultations.
                      The amounts shown above are what you'll receive after the platform fee is deducted.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" className="bg-white">Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Save size={16} className="mr-2" /> Save Changes
            </Button>
          </div>

        </div>
      </div>
    </div>
    )
}