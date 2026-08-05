import { Briefcase, Camera, CheckCircle2, Circle, DollarSign, Eye, EyeOff, HeartPulse, Lock, Mail, MapPin, Parentheses, Phone, ShieldCheck, Stethoscope, User, X } from "lucide-react";
import { useState } from "react";
import { CiHeart } from "react-icons/ci";
import { TbStethoscope } from "react-icons/tb";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import CustomGoogleButton from "../layouts/CustomGoogleButton";
import { useRef } from "react";

export default function RegisterPage() {
    const navigate = useNavigate();

    const [role, setRole] = useState('user');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [numberOfAnimals, setNumberOfAnimals] = useState("");

    const [license, setLicense] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [experience, setExperience] = useState("");
    const [fee, setFee] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({ text: "", isError: false });

    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zip, setZip] = useState("");
    const [country, setCountry] = useState("");

    const [profileImage, setProfileImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    // Password validation states
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

    // Password validation functions
    const validatePassword = (pass) => {
        const errors = [];
        if (pass.length < 8) errors.push("At least 8 characters");
        if (!/[A-Z]/.test(pass)) errors.push("At least one uppercase letter");
        if (!/[a-z]/.test(pass)) errors.push("At least one lowercase letter");
        if (!/[0-9]/.test(pass)) errors.push("At least one number");
        if (!/[^A-Za-z0-9]/.test(pass)) errors.push("At least one special character");
        return errors;
    };

    const getPasswordStrength = () => {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };

    const strength = getPasswordStrength();
    const passwordErrors = validatePassword(password);
    const isPasswordValid = passwordErrors.length === 0 && password.length > 0;
    const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

    // GOOGLE HANDLER
    const handleGoogleSuccess = async (credentialResponse) => {
        console.log("handleGoogleSuccess (register) triggered. credentialResponse:", credentialResponse);

        // Validation for Veterinary Doctors: Contact Number and Professional Details are required for admin approval
        if (role === 'vet') {
            if (!phone) {
                setSubmitMessage({ text: "Please enter your Contact Number before registering with Google.", isError: true });
                toast.error("Contact Number is required for Veterinary Doctor registration.");
                return;
            }
            if (!license || !specialization || !experience || !fee) {
                setSubmitMessage({ text: "Please fill in all Professional Details (License Number, Specialization, Experience, Consultation Fee) before registering with Google.", isError: true });
                toast.error("Professional details are required for administrator approval.");
                return;
            }
        }

        setIsLoading(true);
        const backendRole = role === 'user' ? "Farmer/PetOwner" : "Veterinary Doctor";

        try {
            console.log("Sending token to backend at:", `${import.meta.env.VITE_BACKEND_URL}/api/users/google-login`);
            const payload = {
                token: credentialResponse.access_token,
                role: backendRole,
                contact_No: phone,
                license_number: license,
                specialization: specialization,
                years_of_experience: experience,
                consultation_fee: fee
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/google-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            console.log("Backend response status:", response.status, "data:", data);

            if (response.ok) {
                toast.success("Google Authentication Successful!");
                if (data.token) localStorage.setItem("token", data.token);
                if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

                const finalRole = data.user?.role || (role === 'user' ? 'farmer' : 'doctor');
                if (finalRole === 'farmer') {
                    navigate("/dashboard/user");
                } else if (finalRole === 'doctor') {
                    navigate("/dashboard/doctor");
                }
            } else {
                setSubmitMessage({ text: data.message || "Google registration failed", isError: true });
            }
        } catch (error) {
            console.error("Google registration fetch error:", error);
            setSubmitMessage({ text: "Server connection failed.", isError: true });
        } finally {
            setIsLoading(false);
        }
    };

    // STANDARD REGISTRATION HANDLER
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate password before submission
        if (!isPasswordValid) {
            setSubmitMessage({
                text: "Please ensure your password meets all requirements.",
                isError: true
            });
            setPasswordTouched(true);
            return;
        }

        if (password !== confirmPassword) {
            setSubmitMessage({ text: "Passwords do not match!", isError: true });
            setConfirmPasswordTouched(true);
            return;
        }

        // Additional mandatory validation for Veterinary Doctors
        if (role === 'vet') {
            if (!phone || phone.trim() === '') {
                setSubmitMessage({ text: "Contact Number is required for Veterinary Doctor registration.", isError: true });
                toast.error("Contact Number is required for Veterinary Doctor registration.");
                return;
            }
            if (!license || license.trim() === '' || !specialization || specialization.trim() === '' || experience === '' || fee === '') {
                setSubmitMessage({ text: "All Professional Details (License Number, Specialization, Years of Experience, Consultation Fee) are required for Veterinary Doctor registration.", isError: true });
                toast.error("All Professional Details are required for Veterinary Doctor registration.");
                return;
            }
        }

        setIsLoading(true);
        setSubmitMessage({ text: "", isError: false });

        const backendRole = role === 'user' ? "Farmer/PetOwner" : "Veterinary Doctor";
        const formData = new FormData();
        formData.append("firstName", firstName);
        formData.append("lastName", lastName);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("contact_No", phone);
        formData.append("role", backendRole);

        if (role === 'user') {
            formData.append("numberOfAnimals", numberOfAnimals || 0);
            formData.append("street", street);
            formData.append("city", city);
            formData.append("state", state);
            formData.append("zip", zip);
            formData.append("country", country);
        } else {
            formData.append("license_number", license);
            formData.append("specialization", specialization);
            formData.append("years_of_experience", experience || 0);
            formData.append("consultation_fee", fee || 0);
        }

        if (profileImage) {
            formData.append("profileImage", profileImage);
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/`, {
                method: "POST",
                body: formData
            });

            const result = await response.json();
            if (response.status === 201 || response.status === 200) {
                toast.success("Account created successfully!");
                if (result.token) localStorage.setItem("token", result.token);
                if (result.user) localStorage.setItem("user", JSON.stringify(result.user));
                if (result.user && result.user.id) localStorage.setItem("userId", result.user.id);

                if (role === 'user') {
                    navigate("/dashboard/user");
                } else if (role === 'vet') {
                    navigate("/dashboard/doctor");
                }
            } else {
                setSubmitMessage({ text: result.message || "Registration failed", isError: true });
            }
        } catch {
            setSubmitMessage({ text: "Server connection failed.", isError: true });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-primary flex">
            {/* Left Side - Registration Form */}
            <div className="w-full xl:w-7/12 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12 bg-white overflow-y-auto">
                <div className="max-w-xl w-full py-8 font-[Inter]">
                    {/* logo */}
                    <Link to="/" className="flex items-center gap-2 group mb-10 w-fit">
                        <div>
                            <img src="https://fmuznyrfnjdwxbqsdijw.supabase.co/storage/v1/object/public/uploads/Logo.png" alt="Logo" className="w-[50px] h-[35px] mr-1 object-fill" />
                        </div>
                        <span className="text-2xl font-bold text-slate-800 tracking-tight">VetCloud</span>
                    </Link>

                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create an Account</h1>
                        <p className="text-slate-500 mb-8">Join VetCloud to access professional veterinary care.</p>
                    </div>

                    <form className="space-y-8" onSubmit={handleSubmit}>

                        {submitMessage.text && (
                            <div className={`p-4 rounded-xl text-sm font-bold ${submitMessage.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {submitMessage.text}
                            </div>
                        )}

                        {/* 1. Role Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-800">I am registering as a:</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`cursor-pointer flex flex-col items-center p-4 border-2 rounded-2xl transition-all duration-300 active:scale-95 ${role === 'user' ? 'border-green-600 bg-green-50' : 'border-slate-200 hover:border-green-200 bg-white'}`}>
                                    <input type="radio" name="role" value="user" checked={role === 'user'} onChange={() => setRole('user')} className="sr-only" />
                                    <User size={32} className={`mb-2 ${role === 'user' ? 'text-green-600' : 'text-slate-400'}`} />
                                    <span className={`font-semibold ${role === 'user' ? 'text-green-800' : 'text-slate-600'}`}>Pet Owner / Farmer</span>
                                </label>

                                <label className={`cursor-pointer flex flex-col items-center p-4 border-2 rounded-2xl transition-all duration-300 active:scale-95 ${role === 'vet' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-200 bg-white'}`}>
                                    <input type="radio" name="role" value="vet" checked={role === 'vet'} onChange={() => setRole('vet')} className="sr-only" />
                                    <Stethoscope size={32} className={`mb-2 ${role === 'vet' ? 'text-blue-600' : 'text-slate-400'}`} />
                                    <span className={`font-semibold ${role === 'vet' ? 'text-blue-800' : 'text-slate-600'}`}>Veterinary Doctor</span>
                                </label>
                            </div>
                        </div>



                        {/* 2. Basic Information */}
                        <div className="space-y-5">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                Basic Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" required className={`w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 ${role === 'vet' ? 'focus:ring-blue-500' : 'focus:ring-green-500'}`} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" required className={`w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 ${role === 'vet' ? 'focus:ring-blue-500' : 'focus:ring-green-500'}`} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="0712345678" pattern="[0-9]{10}" required className={`w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 ${role === 'vet' ? 'focus:ring-blue-500' : 'focus:ring-green-500'}`} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" required className={`w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 ${role === 'vet' ? 'focus:ring-blue-500' : 'focus:ring-green-500'}`} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Password Field with Validation */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onBlur={() => setPasswordTouched(true)}
                                            placeholder="••••••••"
                                            required
                                            className={`w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] pr-[40px] p-[10px] text-[14px] focus:outline-none focus:ring-2 ${passwordTouched && !isPasswordValid
                                                ? 'border-red-500 focus:ring-red-500'
                                                : passwordTouched && isPasswordValid
                                                    ? 'border-green-500 focus:ring-green-500'
                                                    : `border-gray-300 ${role === 'vet' ? 'focus:ring-blue-500' : 'focus:ring-green-500'}`
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>

                                    {/* Password Strength Bar */}
                                    {password && (
                                        <div className="mt-2 flex gap-1 h-1.5 w-full">
                                            <div className={`flex-1 rounded-full ${strength >= 1 ? (strength === 1 ? 'bg-red-400' : strength === 2 ? 'bg-amber-400' : 'bg-green-500') : 'bg-slate-200'}`}></div>
                                            <div className={`flex-1 rounded-full ${strength >= 2 ? (strength === 2 ? 'bg-amber-400' : 'bg-green-500') : 'bg-slate-200'}`}></div>
                                            <div className={`flex-1 rounded-full ${strength >= 3 ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                        </div>
                                    )}

                                    {/* Password Requirements List */}
                                    {passwordTouched && !isPasswordValid && (
                                        <div className="mt-3 space-y-1.5 text-xs">
                                            {passwordErrors.map((error, index) => (
                                                <div key={index} className="flex items-center gap-2 text-red-600">
                                                    <X className="h-3 w-3" />
                                                    <span>{error}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {passwordTouched && isPasswordValid && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span>Password meets all requirements</span>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            onBlur={() => setConfirmPasswordTouched(true)}
                                            placeholder="••••••••"
                                            required
                                            className={`w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] pr-[40px] p-[10px] text-[14px] focus:outline-none focus:ring-2 ${confirmPasswordTouched && confirmPassword.length > 0 && !doPasswordsMatch
                                                ? 'border-red-500 focus:ring-red-500'
                                                : confirmPasswordTouched && doPasswordsMatch
                                                    ? 'border-green-500 focus:ring-green-500'
                                                    : `border-gray-300 ${role === 'vet' ? 'focus:ring-blue-500' : 'focus:ring-green-500'}`
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>

                                    {/* Confirm Password Match Indicator */}
                                    {confirmPasswordTouched && confirmPassword.length > 0 && (
                                        <div className="mt-3 flex items-center gap-2 text-xs">
                                            {doPasswordsMatch ? (
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    <span>Passwords match</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-red-600">
                                                    <X className="h-3 w-3" />
                                                    <span>Passwords do not match</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="h-px w-full bg-slate-100" />

                        {/* 3. Conditional Fields */}
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                {role === 'user' ? 'Location & Profile' : 'Professional Details'}
                            </h3>

                            {role === 'user' ? (
                                <>
                                    <div className="space-y-4 mb-5">
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Farm/Home Address</label>

                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                            <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street Address (e.g., 123 Farm Road)" required className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" required className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm px-[15px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" />
                                            <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="State / Province" required className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm px-[15px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP / Postal Code" required className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm px-[15px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" />
                                            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" required className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm px-[15px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Approximate Number of Animals (Optional)</label>
                                        <input
                                            type="number"
                                            value={numberOfAnimals}
                                            onChange={(e) => setNumberOfAnimals(e.target.value)}
                                            placeholder="e.g., 20"
                                            onWheel={(e) => e.target.blur()}
                                            className="w-full h-12 rounded-xl border border-slate-300 bg-transparent pl-4 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Veterinary License Number</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                            <input type="text" value={license} onChange={(e) => setLicense(e.target.value)} placeholder="Enter your license number" required className="w-full h-12 rounded-xl border border-slate-300 bg-transparent pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialization</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                            <select value={specialization} onChange={(e) => setSpecialization(e.target.value)} required className="w-full h-12 rounded-xl border border-slate-300 bg-transparent pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer">
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
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Years of Experience</label>
                                        <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g., 5" required className="w-full h-12 rounded-xl border border-slate-300 bg-transparent pl-4 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Standard Consultation Fee ($)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                            <input type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="e.g., 45.00" required className="w-full h-12 rounded-xl border border-slate-300 bg-transparent pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Profile Picture Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Profile Picture (Optional)</label>
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-slate-300 transition-colors cursor-pointer bg-slate-50 relative overflow-hidden"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setProfileImage(file);
                                                setPreviewUrl(URL.createObjectURL(file));
                                            }
                                        }}
                                    />

                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="h-24 w-24 object-cover rounded-full shadow-sm mb-3 z-10" />
                                    ) : (
                                        <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                                            <Camera className="h-6 w-6 text-slate-400" />
                                        </div>
                                    )}

                                    <p className="text-sm font-medium text-slate-700">Click to upload photo</p>
                                </div>
                            </div>
                        </div>

                        {/* Terms and Submit */}
                        <div className="pt-4">
                            <label className="flex items-start gap-3 mb-6 cursor-pointer group">
                                <div className="relative flex items-center justify-center mt-0.5">
                                    <input type="checkbox" required className="peer sr-only" />
                                    <div className={`w-5 h-5 border-2 border-slate-300 rounded transition-colors ${role === 'vet' ? 'peer-checked:bg-blue-600 peer-checked:border-blue-600' : 'peer-checked:bg-green-600 peer-checked:border-green-600'}`}></div>
                                    <CheckCircle2 className="absolute text-white w-3 h-3 opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <span className="text-sm text-slate-600 leading-relaxed">
                                    I agree to the <Link to="#" className={`font-semibold hover:underline ${role === 'vet' ? 'text-blue-600' : 'text-green-600'}`}>Terms & Conditions</Link> and <Link to="#" className={`font-semibold hover:underline ${role === 'vet' ? 'text-blue-600' : 'text-green-600'}`}>Privacy Policy</Link>, and consent to the processing of my data.
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
                                className={`w-full h-14 rounded-xl text-lg text-white shadow-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${role === 'vet'
                                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                    : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                                    } ${(isLoading || !isPasswordValid || !doPasswordsMatch) ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    "Creating Account..."
                                ) : (
                                    "Create Account"
                                )}
                            </button>
                        </div>

                        {/* SOCIAL OAUTH BUTTONS AREA */}
                        <div className="pt-4 space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-slate-500 font-medium">Or continue with</span>
                                </div>
                            </div>

                            {role === 'vet' && (
                                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 p-3 rounded-xl text-center">
                                    <strong>Note for Doctors:</strong> Please complete your Contact Number and Professional Details above before continuing with Google for administrator verification.
                                </p>
                            )}

                            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                                <CustomGoogleButton
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setSubmitMessage({ text: "Google Authentication failed.", isError: true })}
                                    isLoading={isLoading}
                                />
                            </GoogleOAuthProvider>
                        </div>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-600">
                        Already have an account?{' '}
                        <Link to="/login" className={`font-semibold ${role === 'vet' ? 'text-blue-600 hover:text-blue-700' : 'text-green-600 hover:text-green-700'}`}>
                            Log in here
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Image / Illustration */}
            <div className="hidden xl:flex xl:w-5/12 relative bg-slate-900 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br mix-blend-multiply z-10 ${role === 'vet' ? 'from-blue-600/80 to-slate-900/90' : 'from-green-600/80 to-blue-900/90'}`} />
                <img
                    src={role === 'vet' ? "https://fmuznyrfnjdwxbqsdijw.supabase.co/storage/v1/object/public/uploads/vetcat.jpg" : "https://fmuznyrfnjdwxbqsdijw.supabase.co/storage/v1/object/public/uploads/vetdog.avif"}
                    alt="Veterinary Care"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="relative z-20 flex flex-col justify-center p-16 text-white h-full">
                    <div className="bg-white/10 backdrop-blur-md p-10 rounded-3xl border border-white/20 max-w-md">
                        {role === 'user' ? (
                            <>
                                <div className="bg-green-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                                    <HeartPulse size={32} className="text-green-300" />
                                </div>
                                <h2 className="text-3xl font-bold mb-4 leading-tight">Peace of mind for your animals.</h2>
                                <p className="text-green-50 text-lg leading-relaxed opacity-90">
                                    Register today to get instant access to certified veterinarians, keep digital health records, and schedule consultations with ease.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                                    <Stethoscope size={32} className="text-blue-300" />
                                </div>
                                <h2 className="text-3xl font-bold mb-4 leading-tight">Expand your veterinary practice.</h2>
                                <p className="text-blue-50 text-lg leading-relaxed opacity-90">
                                    Join our network of professionals to reach more farmers and pet owners. Provide remote care and manage your appointments seamlessly.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}