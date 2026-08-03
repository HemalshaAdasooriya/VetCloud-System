import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaRegHeart } from "react-icons/fa";
import { PiEyeLight, PiEyeSlash } from "react-icons/pi";
import { LuLock } from "react-icons/lu";
import { HiOutlineMail } from "react-icons/hi";
import { CiHeart } from "react-icons/ci";
import { TbStethoscope } from "react-icons/tb";
import { MdOutlineShield } from "react-icons/md";
import toast from "react-hot-toast";
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

export default function LoginPage({ defaultRole = null }) {

    const [show2FA, setShow2FA] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [tempLoginData, setTempLoginData] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [role, setRole] = useState(defaultRole);

    const buttonStyle = (value) => `
    group w-full min-h-[76px] p-3 border rounded-xl 
    flex flex-col justify-center items-center text-center
    font-medium text-xs sm:text-sm tracking-wide
    transition-all duration-200 active:scale-[0.98] cursor-pointer

    ${role === value
            ? "border-green-600 text-green-700 bg-green-50/60 shadow-sm ring-1 ring-green-600/30"
            : "border-slate-200 text-slate-600 bg-white hover:border-green-400 hover:text-green-600 hover:bg-green-50/30"
        }
  `;

    const iconStyle = (value) => `
    w-8 h-8 flex justify-center items-center rounded-lg 
    transition-all duration-200 mb-1.5

    ${role === value
            ? "bg-green-600 text-white shadow-sm shadow-green-500/25"
            : "bg-slate-100 text-slate-500 group-hover:bg-green-600 group-hover:text-white"
        }
  `;


    async function handleLogin() {
        if (!role) {
            return toast.error("Please select a role");
        }
        if (!email || !password) {
            return toast.error("Please enter email and password");
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.requires2FA) {
                    setTempLoginData({ userId: data.userId, role: data.role });
                    setShow2FA(true); // Open the 2FA input screen
                    return; // Stop the function here! Do not log them in yet.
                }
                toast.success("Login Successful!");

                // Store the JWT token securely in localStorage or a state manager
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                // --- updated by navindu on 2026-06-10 START ---
                // Also store userId for parts of the app that read it directly
                if (data.user && data.user.id) localStorage.setItem("userId", data.user.id);
                // --- updated by navindu on 2026-06-10 END ---

                // Navigate based on role
                if (role === "farmer") navigate("/dashboard/user");
                if (role === "doctor") navigate("/dashboard/doctor");
                if (role === "admin") navigate("/dashboard/admin");
            } else {
                toast.error(data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error("Server connection failed");
        }
    }

    const handleSubmit2FA = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/verify-login-2fa`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: tempLoginData.userId,
                    role: tempLoginData.role,
                    code: twoFactorCode
                })
            });

            const data = await response.json();

            if (response.ok) {
                // 2FA Success! Now we officially log them in.
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                // --- updated by navindu on 2026-06-10 START ---
                if (data.user && data.user.id) localStorage.setItem("userId", data.user.id);
                // --- updated by navindu on 2026-06-10 END ---
                const currentRole = tempLoginData.role;

                if (currentRole === "farmer") {
                    navigate("/dashboard/user");
                } else if (currentRole === "doctor") {
                    navigate("/dashboard/doctor");
                } else if (currentRole === "admin") {
                    navigate("/dashboard/admin");
                } else {
                    // Fallback just in case
                    navigate("/login");
                    toast.error("Unknown role. Please login again.");
                }
            } else {
                toast.error(data.message || "Invalid Code", "error");
            }
        } catch {
            toast.error("Server error", "error");
        }
    };

    const [isLoading, setIsLoading] = useState(false);

    // --- GOOGLE LOGIN HANDLER ---
    const handleGoogleSuccess = async (tokenResponse) => {
        console.log("handleGoogleSuccess triggered. tokenResponse:", tokenResponse);
        if (!role) return toast.error("Please select a role first!");
        setIsLoading(true);

        try {
            console.log("Sending token to backend at:", `${import.meta.env.VITE_BACKEND_URL}/api/users/google-login`);
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/google-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: tokenResponse.access_token, role: role === 'farmer' ? "Farmer/PetOwner" : role === 'doctor' ? "Veterinary Doctor" : "Admin" })
            });
            const data = await response.json();
            console.log("Backend response status:", response.status, "data:", data);

            if (response.ok) {
                toast.success("Google Login Successful!");
                if (data.token) localStorage.setItem("token", data.token); // Save session
                if (data.user) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                    // --- updated by navindu on 2026-06-10 START ---
                    if (data.user.id) localStorage.setItem("userId", data.user.id);
                    // --- updated by navindu on 2026-06-10 END ---
                }

                // Route to correct dashboard based on actual database role
                const finalRole = data.user?.role || role;
                if (finalRole === "farmer") navigate("/dashboard/user");
                else if (finalRole === "doctor") navigate("/dashboard/doctor");
                else if (finalRole === "admin") navigate("/dashboard/admin");
            } else {
                toast.error(data.message || "Google login failed");
            }
        } catch (error) {
            console.error("Google login fetch error:", error);
            toast.error("Server connection failed.");
        } finally {
            setIsLoading(false);
        }
    };



    const InlineGoogleButton = ({ onSuccess, disabled, role }) => {
        const login = useGoogleLogin({
            onSuccess: onSuccess,
            onError: () => toast.error("Google Authentication failed.")
        });

        const handleLoginClick = () => {
            if (!role) {
                toast.error("Please select a role first!");
                return;
            }
            login();
        };

        return (
            <button
                type="button"
                onClick={handleLoginClick}
                disabled={disabled}
                className="w-full h-11 sm:h-12 border border-slate-200 text-slate-700 font-Inter font-medium text-xs sm:text-sm rounded-xl flex justify-center items-center hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm disabled:opacity-70 cursor-pointer"
            >
                <FcGoogle className="w-5 h-5 mr-2.5 flex-shrink-0" />
                <span>Continue with Google</span>
            </button>
        );
    };

    return (
        <div className="w-full min-h-screen bg-slate-50/60 flex flex-col md:flex-row">
            {/* Left Hero Column - Visible on md and larger screens */}
            <div className="hidden md:flex md:w-1/2 min-h-screen bg-gradient-to-br from-[rgba(0,166,62,0.90)] to-[rgba(28,57,142,0.95)] p-8 lg:p-12 xl:p-16 flex-col justify-between relative overflow-hidden">
                {/* Background decorative glow elements */}
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-green-400/20 blur-3xl pointer-events-none" />

                {/* Hero Header Branding */}
                <div className="relative z-10 flex items-center space-x-3">
                    <img 
                        src="https://fmuznyrfnjdwxbqsdijw.supabase.co/storage/v1/object/public/uploads/Logo.png" 
                        className="w-10 h-10 object-contain drop-shadow-md brightness-0 invert" 
                        alt="VetCloud Logo" 
                    />
                    <span className="text-2xl font-bold text-white tracking-tight font-Inter">VetCloud</span>
                </div>

                {/* Hero Middle Content Card */}
                <div className="relative z-10 my-auto py-6">
                    <div className="w-full max-w-lg backdrop-blur-md bg-white/15 border border-white/25 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-4">
                        <h1 className="font-Inter text-2xl lg:text-3xl text-white font-bold leading-tight">
                            Empowering Animal Health
                        </h1>
                        <p className="text-[#F0FDF4] font-Inter font-light text-sm lg:text-base leading-relaxed">
                            Connect with certified veterinary professionals instantly. The best care for your livestock and pets is just a click away.
                        </p>
                    </div>
                </div>

                {/* Hero Footer */}
                <div className="relative z-10 text-white/70 text-xs font-Inter">
                    © {new Date().getFullYear()} VetCloud System. All rights reserved.
                </div>
            </div>

            {/* Right Form Column */}
            <div className="w-full md:w-1/2 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-y-auto">
                <div className="w-full max-w-md lg:max-w-lg bg-white rounded-2xl shadow-xl sm:shadow-2xl border border-slate-100 p-6 sm:p-8 lg:p-10 my-auto">
                    <div className="w-full flex flex-col">
                        {show2FA ? (
                            /* --- THE 2FA SCREEN --- */
                            <form onSubmit={handleSubmit2FA} className="flex flex-col items-center justify-center w-full space-y-5 py-2">
                                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-sm border border-green-100">
                                    <MdOutlineShield className="w-7 h-7" />
                                </div>
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-slate-900 font-Inter">Security Verification</h2>
                                    <p className="text-center text-slate-500 text-xs sm:text-sm font-Inter mt-1.5">
                                        Enter the 6-digit code from your Authenticator app to continue.
                                    </p>
                                </div>

                                <div className="w-full max-w-xs">
                                    <input
                                        type="text"
                                        maxLength="6"
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value)}
                                        placeholder="000000"
                                        className="w-full h-14 px-4 text-center tracking-[0.4em] sm:tracking-[0.6em] text-2xl sm:text-3xl font-bold rounded-xl border border-slate-300 shadow-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-slate-800"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="w-full h-11 sm:h-12 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-Inter font-medium rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98] shadow-md hover:shadow-lg mt-2"
                                >
                                    Verify & Login
                                </button>

                                <button 
                                    type="button" 
                                    onClick={() => setShow2FA(false)} 
                                    className="w-full py-2 text-slate-500 text-xs sm:text-sm font-Inter font-medium hover:text-slate-700 transition-colors"
                                >
                                    Cancel & Go Back
                                </button>
                            </form>
                        ) : (
                            /* --- THE NORMAL LOGIN SCREEN --- */
                            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="w-full flex flex-col">
                                {/* Mobile Header Logo */}
                                <div className="flex items-center gap-2 mb-4">
                                    <img 
                                        src="https://fmuznyrfnjdwxbqsdijw.supabase.co/storage/v1/object/public/uploads/Logo.png" 
                                        className="w-9 h-7 object-contain" 
                                        alt="VetCloud Logo" 
                                    />
                                    <span className="text-xl font-bold text-slate-900 font-Inter">VetCloud</span>
                                </div>

                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-Inter tracking-tight">
                                    Welcome back!
                                </h2>
                                <p className="text-slate-500 text-xs sm:text-sm font-Inter font-normal mt-1">
                                    Access veterinary care anytime, anywhere.
                                </p>

                                {defaultRole === "admin" ? (
                                    <div className="text-slate-800 text-base font-semibold mt-4 mb-2 font-Inter bg-slate-100 p-3 rounded-xl border border-slate-200 text-center">
                                        Sign in as Administrator
                                    </div>
                                ) : (
                                    <div className="mt-4">
                                        <label className="block text-slate-700 text-xs sm:text-sm font-medium font-Inter mb-2">
                                            Sign in as
                                        </label>

                                        {/* Role selection Grid */}
                                        <div className="grid grid-cols-2 gap-3 w-full">
                                            <button 
                                                type="button" 
                                                onClick={() => setRole("farmer")} 
                                                className={buttonStyle("farmer")}
                                            >
                                                <div className={iconStyle("farmer")}>
                                                    <CiHeart className="h-5 w-5" />
                                                </div>
                                                <span>Pet Owner / Farmer</span>
                                            </button>

                                            <button 
                                                type="button" 
                                                onClick={() => setRole("doctor")} 
                                                className={buttonStyle("doctor")}
                                            >
                                                <div className={iconStyle("doctor")}>
                                                    <TbStethoscope className="h-5 w-5" />
                                                </div>
                                                <span>Veterinary Doctor</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Inputs Section */}
                                <div className="space-y-4 mt-4">
                                    {/* Email Field */}
                                    <div>
                                        <label className="block text-slate-700 font-medium text-xs sm:text-sm font-Inter mb-1.5">
                                            Email Address
                                        </label>
                                        <div className="relative w-full">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                <HiOutlineMail className="w-5 h-5" />
                                            </span>
                                            <input 
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter Your Email"
                                                className="w-full h-11 sm:h-12 rounded-xl border border-slate-300 shadow-sm pl-11 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Password Field */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5 font-Inter">
                                            <label className="text-slate-700 font-medium text-xs sm:text-sm">
                                                Password
                                            </label>
                                            <Link to="/forgot-password" className="text-xs text-green-600 hover:text-green-700 hover:underline font-normal">
                                                Forgot Password?
                                            </Link>
                                        </div>
                                        <div className="relative w-full">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                <LuLock className="w-5 h-5" />
                                            </span>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Your Password"
                                                className="w-full h-11 sm:h-12 rounded-xl border border-slate-300 shadow-sm pl-11 pr-11 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <PiEyeLight className="w-5 h-5" /> : <PiEyeSlash className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {defaultRole !== "admin" && (
                                    <>
                                        <div className="relative flex items-center justify-center my-4">
                                            <div className="w-full border-t border-slate-200"></div>
                                            <span className="absolute bg-white px-3 text-xs text-slate-400 font-Inter font-normal">
                                                or continue with
                                            </span>
                                        </div>

                                        {/* Google login button */}
                                        <div className="w-full">
                                            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                                                <InlineGoogleButton
                                                    onSuccess={handleGoogleSuccess}
                                                    disabled={isLoading}
                                                    role={role}
                                                />
                                            </GoogleOAuthProvider>
                                        </div>
                                    </>
                                )}

                                <button 
                                    type="submit" 
                                    className={`w-full h-11 sm:h-12 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-Inter font-medium rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98] shadow-md hover:shadow-lg flex items-center justify-center ${defaultRole === "admin" ? "mt-6" : "mt-4"}`}
                                >
                                    Login to Dashboard
                                </button>

                                {defaultRole !== "admin" && (
                                    <p className="mt-4 text-center text-xs sm:text-sm text-slate-500 font-Inter font-normal">
                                        Don't have an account?{" "}
                                        <Link to="/register" className="text-green-600 font-medium hover:underline hover:text-green-700">
                                            Register here
                                        </Link>
                                    </p>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}