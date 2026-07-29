import { useState, useEffect } from 'react';
import { User, Shield, Key, Bell, Smartphone, LogOut, CreditCard } from 'lucide-react';
import { Card, Badge, Button, Input } from '../../components/Ui/ui';
import toast from 'react-hot-toast';

export default function Settings() {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    const [activeTab, setActiveTab] = useState("profile");

    // Profile fields
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [contactNo, setContactNo] = useState("");
    const [loading, setLoading] = useState(false);

    // Password fields
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Commission/Payment Settings fields
    const [commissionPercentage, setCommissionPercentage] = useState("10");

    // Load user data & system settings
    useEffect(() => {
        if (user) {
            setFullName(user.fullName || "");
            setEmail(user.email || "");
            setContactNo(user.contact_No || "");
        }
        
        const fetchSystemSettings = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings`, {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.commission_percentage) {
                        setCommissionPercentage(data.commission_percentage);
                    }
                }
            } catch (err) {
                console.error("Error fetching system settings:", err);
            }
        };
        fetchSystemSettings();
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    contact_No: contactNo
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to update profile");
            }

            const data = await res.json();
            toast.success("Profile details updated!");
            
            // Save updated user data back into localstorage & trigger layout update
            const updatedUser = { ...user, fullName, email, contact_No: contactNo };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            window.dispatchEvent(new Event("profileImageUpdated"));
        } catch (error) {
            console.error("Update profile error:", error);
            toast.error(error.message || "Error updating profile details");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("New password and confirm password do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    contact_No: contactNo,
                    password: newPassword
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to change password");
            }

            toast.success("Password changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            console.error("Change password error:", error);
            toast.error(error.message || "Error modifying security settings");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/settings`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    commission_percentage: parseFloat(commissionPercentage)
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to update settings");
            }

            toast.success("Platform settings updated successfully!");
        } catch (error) {
            console.error("Update settings error:", error);
            toast.error(error.message || "Error updating payment settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            
            {/* Sidebar navigation tabs */}
            <Card className="p-4 md:col-span-1 space-y-1">
                <button 
                    onClick={() => setActiveTab("profile")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'profile' ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <User size={18} />
                    Profile Details
                </button>
                <button 
                    onClick={() => setActiveTab("security")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'security' ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <Shield size={18} />
                    Security Settings
                </button>
                <button 
                    onClick={() => setActiveTab("payment")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'payment' ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <CreditCard size={18} />
                    Payment Settings
                </button>
            </Card>

            {/* Sub-form panels */}
            <Card className="p-6 md:col-span-3">
                {activeTab === "profile" && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Profile Details</h3>
                            <p className="text-sm text-slate-500">Update your administrator account basic information.</p>
                        </div>
                        <hr className="border-slate-100" />
                        
                        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                                <Input 
                                    type="text" 
                                    required 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter full name..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                                <Input 
                                    type="email" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email address..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contact Number</label>
                                <Input 
                                    type="text" 
                                    value={contactNo}
                                    onChange={(e) => setContactNo(e.target.value)}
                                    placeholder="Enter phone number..."
                                />
                            </div>

                            <div className="pt-2">
                                <Button 
                                    type="submit" 
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6"
                                >
                                    {loading ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === "security" && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Security Credentials</h3>
                            <p className="text-sm text-slate-500">Modify your login password and manage authentication settings.</p>
                        </div>
                        <hr className="border-slate-100" />
                        
                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Password</label>
                                <Input 
                                    type="password" 
                                    required 
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Password</label>
                                <Input 
                                    type="password" 
                                    required 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                                <Input 
                                    type="password" 
                                    required 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="pt-2">
                                <Button 
                                    type="submit" 
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6"
                                >
                                    {loading ? "Updating..." : "Update Password"}
                                </Button>
                            </div>
                        </form>

                        <hr className="border-slate-100" />

                        <div className="space-y-4 max-w-xl">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Smartphone size={16} className="text-slate-400" />
                                Two-Factor Authentication (2FA)
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Require a 6-digit OTP code in addition to your login credentials to verify your identity when signing in as an administrator. 
                            </p>
                            <Badge variant="warning" className="px-3 py-1 font-semibold text-[10px]">
                                Managed by OTP Service
                            </Badge>
                        </div>
                    </div>
                )}

                {activeTab === "payment" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Payment & Commission Settings</h3>
                            <p className="text-sm text-slate-500">Configure platform-wide transaction fees and commission percentages.</p>
                        </div>
                        <hr className="border-slate-100" />
                        
                        <form onSubmit={handleUpdateSettings} className="space-y-4 max-w-xl">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Platform Commission Fee (%)</label>
                                <div className="relative max-w-xs">
                                    <Input 
                                        type="number" 
                                        required 
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={commissionPercentage}
                                        onChange={(e) => setCommissionPercentage(e.target.value)}
                                        placeholder="10"
                                        className="pr-10 bg-white"
                                    />
                                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                                        %
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                                    This percentage is added on top of a doctor's base consultation fee. For example, if a veterinarian charges LKR 1,000 and the commission is 10%, the client will pay a total of LKR 1,100, and VetCloud retains LKR 100 as the platform fee.
                                </p>
                            </div>

                            <div className="pt-2">
                                <Button 
                                    type="submit" 
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6"
                                >
                                    {loading ? "Saving Settings..." : "Save Settings"}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </Card>

        </div>
    );
}
