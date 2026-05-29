import React, { useState, useRef } from 'react';

export default function UserSettings() {
    const [activeTab, setActiveTab] = useState('profile');
    const fileInputRef = useRef(null);

    // --- Profile State ---
  const [profilePhoto, setProfilePhoto] = useState();
  const [personalInfo, setPersonalInfo] = useState({
    firstName: 'John',
    lastName: 'Farmer',
    phone: '+1 (555) 123-4567',
    userType: 'Livestock Owner',
  });
  const [farmInfo, setFarmInfo] = useState({
    farmName: 'Green Valley Farm',
    farmSize: '150 acres',
    bio: 'Tell us about your farm or business...',
  });
  const [addressInfo, setAddressInfo] = useState({
    street: '1234 Rural Route 5',
    city: 'Springfield',
    state: 'Illinois',
    zip: '62701',
    country: 'United States',
  });

  // --- Security State ---
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: 'Chrome on Windows', location: 'Springfield, IL', time: 'Active now', isCurrent: true },
    { id: 2, device: 'Safari on iPhone', location: 'Springfield, IL', time: '2 days ago', isCurrent: false },
  ]);

  // --- Feedback States ---
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'info' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // --- Profile Photo Handlers ---
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Show local preview immediately so the UI feels fast
    const localUrl = URL.createObjectURL(file);
    setProfilePhoto(localUrl);

    // 2. Prepare the file to be sent over the internet
    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      // 3. Send to your backend (Make sure your token is included!)
      const token = localStorage.getItem("token"); // Assuming you saved JWT here during login
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/upload-photo`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}` // No Content-Type header needed for FormData!
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Profile photo updated successfully in database!');
        // Optional: Update your state with the secure URL returned from the backend
        // setProfilePhoto(data.imageUrl); 
      } else {
        showToast(data.message || 'Upload failed', 'error');
      }
    } catch (error) {
      console.error("Upload error:", error);
      showToast('Server connection failed', 'error');
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemovePhoto = () => {
    // Revert to a clean svg avatar generator placeholder
    setProfilePhoto(`https://api.dicebear.com/7.x/initials/svg?seed=${personalInfo.firstName}%20${personalInfo.lastName}&backgroundColor=10b981`);
    showToast('Profile photo removed.');
  };

  // --- Save Changes Handler ---
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!personalInfo.firstName.trim() || !personalInfo.lastName.trim()) {
      showToast('First Name and Last Name are required!', 'error');
      return;
    }
    showToast('Changes saved successfully!');
  };

  const handleCancelProfile = () => {
    setPersonalInfo({
      firstName: 'John',
      lastName: 'Farmer',
      phone: '+1 (555) 123-4567',
      userType: 'Livestock Owner',
    });
    setFarmInfo({
      farmName: 'Green Valley Farm',
      farmSize: '150 acres',
      bio: 'Tell us about your farm or business...',
    });
    setAddressInfo({
      street: '1234 Rural Route 5',
      city: 'Springfield',
      state: 'Illinois',
      zip: '62701',
      country: 'United States',
    });
    
    showToast('Changes reverted.', 'info');
  };

  // --- Password Strength Verification ---
  const validatePasswordStrength = (pwd) => {
    const hasMinLen = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    return {
      isValid: hasMinLen && hasUpper && hasLower && hasNumber,
      checks: { hasMinLen, hasUpper, hasLower, hasNumber }
    };
  };

  const passwordStrength = validatePasswordStrength(passwords.new);

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!passwords.current) {
      showToast('Please enter your current password.', 'error');
      return;
    }
    if (!passwordStrength.isValid) {
      showToast('New password does not meet security requirements.', 'error');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    setPasswords({ current: '', new: '', confirm: '' });
    showToast('Password updated successfully!');
  };

  // --- 2FA Handlers ---
  const handleEnable2FA = () => {
    if (is2FAEnabled) {
      setIs2FAEnabled(false);
      showToast('Two-Factor Authentication disabled.', 'info');
    } else {
      setShow2FAModal(true);
    }
  };

  const verify2FACode = (e) => {
    e.preventDefault();
    if (verificationCode.trim().length === 6) {
      setIs2FAEnabled(true);
      setShow2FAModal(false);
      setVerificationCode('');
      showToast('Two-Factor Authentication enabled successfully!');
    } else {
      showToast('Please enter a valid 6-digit code.', 'error');
    }
  };

  // --- Session Handlers ---
  const handleRevokeSession = (id) => {
    setActiveSessions(activeSessions.filter(s => s.id !== id));
    showToast('Session revoked successfully.');
  };

  const handleSignOutOtherSessions = () => {
    setActiveSessions(activeSessions.filter(s => s.isCurrent));
    showToast('All other sessions signed out.');
  };
    
    
    return (
    <div className="flex-1 bg-slate-50/50 flex flex-col relative h-full">
        <main className="flex-1 p-4 max-w-5xl mx-auto w-full">
            {/* Page Titles */}
            <div className="mb-8 animate-fade-in-up">
                <h1 className="font-Inter font-extrabold text-3xl text-slate-800 tracking-tight">Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Manage your account settings and preferences</p>
            </div>

            {/* Tab Navigations */}
            <div className="border-b border-slate-200 mb-8 flex gap-6 shrink-0 animate-fade-in-up">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'profile'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Information
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'security'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Security
                </button>
            </div>

            {/* Tab Content Panels */}
            <div className="space-y-6">
            {activeTab === 'profile' ? (
                <form onSubmit={handleSaveProfile} className="space-y-6 animate-fade-in-up">
                {/* Profile Photo Section */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-6 font-display">Profile Photo</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Photo container with hover edit overlay */}
                    <div className="relative group cursor-pointer" onClick={triggerFileSelect}>
                        <img
                        src={profilePhoto}
                        alt="Profile Avatar"
                        className="w-24 h-24 rounded-full object-cover border border-slate-100 shadow-md group-hover:brightness-95 transition-all duration-200"
                        />
                        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white border-2 border-white shadow-xs group-hover:scale-105 transition-all duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        </div>
                    </div>
                    {/* File Upload controls */}
                    <div className="text-center sm:text-left">
                        <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                        />
                        <p className="text-xs text-slate-400 font-medium max-w-[280px] mb-4">
                        Upload a new profile picture. Recommended size is 400×400px.
                        </p>
                        <div className="flex items-center justify-center sm:justify-start gap-4">
                        <button
                            type="button"
                            onClick={triggerFileSelect}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
                        >
                            Upload Photo
                        </button>
                        <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                        >
                            Remove
                        </button>
                        </div>
                    </div>
                    </div>
                </div>

                {/* Personal Information Section */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-6 font-display">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">
                        First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                        type="text"
                        required
                        value={personalInfo.firstName}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-hidden transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300"
                        />
                    </div>
                    {/* Last Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">
                        Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                        type="text"
                        required
                        value={personalInfo.lastName}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-hidden transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300"
                        />
                    </div>
                    {/* Phone Number */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                        type="text"
                        required
                        value={personalInfo.phone}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-hidden transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300"
                        />
                    </div>
                    {/* User Type */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">User Type</label>
                        <select
                        value={personalInfo.userType}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, userType: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 outline-hidden text-sm font-semibold text-slate-500 cursor-not-allowed"
                        disabled
                        >
                        <option value="Livestock Owner">Livestock Owner</option>
                        <option value="Veterinarian">Veterinarian</option>
                        <option value="Clinic Manager">Clinic Manager</option>
                        </select>
                    </div>
                    </div>
                </div>

                {/* Farm / Business Information Section */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                    <span className="w-5 h-5 text-emerald-500 flex items-center justify-center">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </span>
                    <h3 className="text-base font-bold text-slate-800 font-display">Farm/Business Information</h3>
                    </div>
                    <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Farm Name */}
                        <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Farm/Business Name</label>
                        <input
                            type="text"
                            value={farmInfo.farmName}
                            onChange={(e) => setFarmInfo({ ...farmInfo, farmName: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-hidden transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300"
                        />
                        </div>
                        {/* Farm Size */}
                        <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Farm Size (optional)</label>
                        <input
                            type="text"
                            value={farmInfo.farmSize}
                            onChange={(e) => setFarmInfo({ ...farmInfo, farmSize: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-hidden transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300"
                        />
                        </div>
                    </div>
                    {/* Bio Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Bio / Description</label>
                        <textarea
                        rows="4"
                        value={farmInfo.bio}
                        onChange={(e) => setFarmInfo({ ...farmInfo, bio: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-hidden transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300 resize-none"
                        ></textarea>
                    </div>
                    </div>
                </div>

                {/* Address Information Section */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-6 font-display">Address Information</h3>
                    <div className="space-y-6">
                    {/* Street Address */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Street Address</label>
                        <input
                        type="text"
                        value={addressInfo.street}
                        onChange={(e) => setAddressInfo({ ...addressInfo, street: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-hidden transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* City */}
                        <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">City</label>
                        <input
                            type="text"
                            value={addressInfo.city}
                            onChange={(e) => setAddressInfo({ ...addressInfo, city: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-hidden transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300"
                        />
                        </div>
                        {/* State / Province */}
                        <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">State/Province</label>
                        <input
                            type="text"
                            value={addressInfo.state}
                            onChange={(e) => setAddressInfo({ ...addressInfo, state: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-hidden transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300"
                        />
                        </div>
                        {/* ZIP / Postal Code */}
                        <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">ZIP/Postal Code</label>
                        <input
                            type="text"
                            value={addressInfo.zip}
                            onChange={(e) => setAddressInfo({ ...addressInfo, zip: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-hidden transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300"
                        />
                        </div>
                        {/* Country */}
                        <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Country</label>
                        <input
                            type="text"
                            value={addressInfo.country}
                            onChange={(e) => setAddressInfo({ ...addressInfo, country: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-hidden transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300"
                        />
                        </div>
                    </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 shrink-0 pt-4 border-t border-slate-100">
                    <button
                    type="button"
                    onClick={handleCancelProfile}
                    className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                    >
                    Cancel
                    </button>
                    <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Changes
                    </button>
                </div>
                </form>
            ) : (
                <div className="space-y-6 animate-fade-in-up">
                {/* Change Password Card */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                    <span className="w-5 h-5 text-emerald-500 flex items-center justify-center">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </span>
                    <h3 className="text-base font-bold text-slate-800 font-display">Change Password</h3>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
                    {/* Current Password */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Current Password</label>
                        <input
                        type="password"
                        placeholder="Enter current password"
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/30 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-hidden transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300"
                        />
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">New Password</label>
                        <input
                        type="password"
                        placeholder="Enter new password"
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border bg-slate-50/30 focus:bg-white outline-hidden transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300 ${
                            passwords.new
                            ? passwordStrength.isValid
                                ? 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                                : 'border-amber-200 focus:border-amber-500 focus:ring-amber-500/20'
                            : 'border-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20'
                        }`}
                        />
                        {/* Password criteria checklist */}
                        {passwords.new && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100 animate-fade-in-up">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password Strength Checklist:</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div className="flex items-center gap-2 text-xs font-medium">
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-white ${passwordStrength.checks.hasMinLen ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                ✓
                                </span>
                                <span className={passwordStrength.checks.hasMinLen ? 'text-slate-600' : 'text-slate-400'}>8+ Characters</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium">
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-white ${passwordStrength.checks.hasUpper ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                ✓
                                </span>
                                <span className={passwordStrength.checks.hasUpper ? 'text-slate-600' : 'text-slate-400'}>Uppercase Letter</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium">
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-white ${passwordStrength.checks.hasLower ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                ✓
                                </span>
                                <span className={passwordStrength.checks.hasLower ? 'text-slate-600' : 'text-slate-400'}>Lowercase Letter</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium">
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-white ${passwordStrength.checks.hasNumber ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                ✓
                                </span>
                                <span className={passwordStrength.checks.hasNumber ? 'text-slate-600' : 'text-slate-400'}>Includes Numbers</span>
                            </div>
                            </div>
                        </div>
                        )}
                        {!passwords.new && (
                        <p className="text-xs text-slate-400 mt-2 font-medium">
                            Password must be at least 8 characters with uppercase, lowercase, and numbers
                        </p>
                        )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Confirm New Password</label>
                        <input
                        type="password"
                        placeholder="Confirm new password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border bg-slate-50/30 focus:bg-white outline-hidden transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300 ${
                            passwords.confirm
                            ? passwords.new === passwords.confirm
                                ? 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                                : 'border-red-200 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20'
                        }`}
                        />
                        {passwords.confirm && passwords.new !== passwords.confirm && (
                        <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Passwords do not match
                        </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                        type="submit"
                        disabled={!passwordStrength.isValid || passwords.new !== passwords.confirm}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all cursor-pointer ${
                            passwordStrength.isValid && passwords.new === passwords.confirm
                            ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10 hover:shadow-emerald-500/20'
                            : 'bg-slate-300 shadow-none cursor-not-allowed'
                        }`}
                        >
                        Update Password
                        </button>
                    </div>
                    </form>
                </div>

                {/* Two-Factor Authentication Section */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                    <span className="w-5 h-5 text-blue-500 flex items-center justify-center">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </span>
                    <h3 className="text-base font-bold text-slate-800 font-display">Two-Factor Authentication</h3>
                    </div>

                    <div className="max-w-2xl space-y-6">
                    {/* Status Banner */}
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                        <span className="w-5 h-5 text-blue-500 shrink-0 mt-0.5">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </span>
                        <div>
                        <p className="text-xs text-blue-800 leading-relaxed font-medium">
                            Add an extra layer of security to your account by enabling two-factor authentication. You'll need to enter a code from your phone in addition to your password when logging in.
                        </p>
                        </div>
                    </div>

                    {/* Setup trigger buttons */}
                    <div className="flex items-center gap-4">
                        <button
                        type="button"
                        onClick={handleEnable2FA}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            is2FAEnabled
                            ? 'border border-red-200 text-red-500 bg-white hover:bg-red-50/50'
                            : 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                        }`}
                        >
                        {is2FAEnabled ? 'Disable Two-Factor Auth' : 'Enable Two-Factor Authentication'}
                        </button>
                        {is2FAEnabled && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                        </span>
                        )}
                    </div>
                    </div>
                </div>

                {/* Active Sessions Card */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-6 font-display">Active Sessions</h3>
                    
                    <div className="space-y-4">
                    {activeSessions.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 font-medium italic">No active sessions (Simulated error: You need at least one session).</p>
                    ) : (
                        activeSessions.map((session) => (
                        <div
                            key={session.id}
                            className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center justify-between transition-all duration-300 animate-fade-in-up"
                        >
                            <div className="flex items-start gap-3">
                            {/* Device icon */}
                            <span className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center shrink-0 shadow-xs">
                                {session.device.toLowerCase().includes('phone') ? (
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                ) : (
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                )}
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{session.device}</p>
                                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                {session.location} • {session.time}
                                </p>
                            </div>
                            </div>

                            {/* Status / Revoke action */}
                            <div>
                            {session.isCurrent ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold">
                                Current Session
                                </span>
                            ) : (
                                <button
                                type="button"
                                onClick={() => handleRevokeSession(session.id)}
                                className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors py-1 px-3 hover:bg-red-50 rounded-lg cursor-pointer"
                                >
                                Revoke
                                </button>
                            )}
                            </div>
                        </div>
                        ))
                    )}

                    {/* Sign out other sessions */}
                    {activeSessions.length > 1 && (
                        <div className="pt-2">
                        <button
                            type="button"
                            onClick={handleSignOutOtherSessions}
                            className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-xs font-bold bg-white hover:bg-red-50/50 shadow-xs transition-colors cursor-pointer"
                        >
                            Sign Out All Other Sessions
                        </button>
                        </div>
                    )}
                    </div>
                </div>
                </div>
            )}
            </div>
        </main>

        {/* Floating interactive Toast Alert */}
        {toast && (
            <div className="fixed bottom-6 right-6 z-50 animate-toast-slide-in">
            <div className={`px-4 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border ${
                toast.type === 'error'
                ? 'bg-red-50 border-red-100 text-red-800'
                : toast.type === 'info'
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-emerald-50 border-emerald-100 text-emerald-800'
            }`}>
                <span className="shrink-0">
                {toast.type === 'error' ? (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                ) : toast.type === 'info' ? (
                    <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                )}
                </span>
                <span className="text-xs font-bold leading-relaxed">{toast.message}</span>
            </div>
            </div>
        )}

        {/* Two Factor setup Interactive Modal mockup */}
        {show2FAModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl p-6 relative animate-toast-slide-in">
                {/* Close Button */}
                <button
                onClick={() => setShow2FAModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>

                <div className="text-center">
                {/* Shield Icon */}
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                <h3 className="font-display font-extrabold text-lg text-slate-800 mb-1">Set Up 2FA</h3>
                <p className="text-xs text-slate-400 font-medium px-4 mb-6">
                    Scan the QR code below using your authentication app (Google Authenticator, Authy, etc.) then enter the 6-digit code.
                </p>

                {/* QR Mockup */}
                <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl mx-auto flex items-center justify-center mb-6 p-2">
                    {/* QR code graphic mockup using CSS */}
                    <div className="w-full h-full bg-slate-800 rounded-lg flex flex-wrap p-3 opacity-90">
                    <div className="w-1/3 h-1/3 border-4 border-white bg-slate-800 flex items-center justify-center"><div className="w-2 h-2 bg-white"></div></div>
                    <div className="w-1/3 h-1/3 bg-slate-800"></div>
                    <div className="w-1/3 h-1/3 border-4 border-white bg-slate-800 flex items-center justify-center"><div className="w-2 h-2 bg-white"></div></div>
                    <div className="w-1/3 h-1/3 bg-slate-800"></div>
                    <div className="w-1/3 h-1/3 bg-white"></div>
                    <div className="w-1/3 h-1/3 bg-slate-800"></div>
                    <div className="w-1/3 h-1/3 border-4 border-white bg-slate-800 flex items-center justify-center"><div className="w-2 h-2 bg-white"></div></div>
                    <div className="w-1/3 h-1/3 bg-slate-800"></div>
                    <div className="w-1/3 h-1/3 bg-white"></div>
                    </div>
                </div>

                {/* Code Entry Form */}
                <form onSubmit={verify2FACode} className="space-y-4">
                    <div>
                    <input
                        type="text"
                        maxLength="6"
                        placeholder="Enter 6-digit code (e.g. 123456)"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-center tracking-[0.25em] outline-hidden text-sm font-bold text-slate-800 placeholder:text-slate-300 placeholder:tracking-normal"
                    />
                    </div>
                    <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setShow2FAModal(false)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
                    >
                        Verify Code
                    </button>
                    </div>
                </form>
                </div>
            </div>
            </div>
        )}{/* Two Factor setup Interactive Modal mockup */}
        {show2FAModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl p-6 relative animate-toast-slide-in">
                {/* Close Button */}
                <button
                onClick={() => setShow2FAModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>

                <div className="text-center">
                {/* Shield Icon */}
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                <h3 className="font-display font-extrabold text-lg text-slate-800 mb-1">Set Up 2FA</h3>
                <p className="text-xs text-slate-400 font-medium px-4 mb-6">
                    Scan the QR code below using your authentication app (Google Authenticator, Authy, etc.) then enter the 6-digit code.
                </p>

                {/* QR Mockup */}
                <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl mx-auto flex items-center justify-center mb-6 p-2">
                    {/* QR code graphic mockup using CSS */}
                    <div className="w-full h-full bg-slate-800 rounded-lg flex flex-wrap p-3 opacity-90">
                    <div className="w-1/3 h-1/3 border-4 border-white bg-slate-800 flex items-center justify-center"><div className="w-2 h-2 bg-white"></div></div>
                    <div className="w-1/3 h-1/3 bg-slate-800"></div>
                    <div className="w-1/3 h-1/3 border-4 border-white bg-slate-800 flex items-center justify-center"><div className="w-2 h-2 bg-white"></div></div>
                    <div className="w-1/3 h-1/3 bg-slate-800"></div>
                    <div className="w-1/3 h-1/3 bg-white"></div>
                    <div className="w-1/3 h-1/3 bg-slate-800"></div>
                    <div className="w-1/3 h-1/3 border-4 border-white bg-slate-800 flex items-center justify-center"><div className="w-2 h-2 bg-white"></div></div>
                    <div className="w-1/3 h-1/3 bg-slate-800"></div>
                    <div className="w-1/3 h-1/3 bg-white"></div>
                    </div>
                </div>

                {/* Code Entry Form */}
                <form onSubmit={verify2FACode} className="space-y-4">
                    <div>
                    <input
                        type="text"
                        maxLength="6"
                        placeholder="Enter 6-digit code (e.g. 123456)"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-center tracking-[0.25em] outline-hidden text-sm font-bold text-slate-800 placeholder:text-slate-300 placeholder:tracking-normal"
                    />
                    </div>
                    <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setShow2FAModal(false)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
                    >
                        Verify Code
                    </button>
                    </div>
                </form>
                </div>
            </div>
            </div>
        )}

        
    </div>
        
    );
}