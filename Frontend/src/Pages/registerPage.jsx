import { Briefcase, Camera, CheckCircle2, Circle, DollarSign, Eye, EyeOff, HeartPulse, Lock, Mail, MapPin, Parentheses, Phone, ShieldCheck, Stethoscope, User } from "lucide-react";
import { useState } from "react";
import { CiHeart } from "react-icons/ci";
import { TbStethoscope } from "react-icons/tb";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import FacebookLogin, { FacebookLoginClient } from '@greatsumini/react-facebook-login';
import CustomGoogleButton from "../layouts/CustomGoogleButton";
import CustomFacebookButton from "../layouts/CustomFacebookButton";




export default function RegisterPage() {
    // const navigate = useNavigate();

    const [role, setRole] = useState('user');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    // const [address, setAddress] = useState("");
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

    const getPasswordStrength = () => {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };
    const strength = getPasswordStrength();


    // GOOGLE HANDLER

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        const backendRole = role === 'user' ? "Farmer/PetOwner" : "Veterinary Doctor";
        
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/google-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: credentialResponse.credential, role: backendRole })
            });
            const data = await response.json();
            
            if (response.ok) {
                toast.success("Google Authentication Successful!");
                // navigate("/dashboard"); 
            } else {
                setSubmitMessage({ text: data.message || "Google registration failed", isError: true });
            }
        } catch {
            setSubmitMessage({ text: "Server connection failed.", isError: true });
        } finally {
            setIsLoading(false);
        }
    };

    
    // FACEBOOK HANDLER
   
    const handleFacebookResponse = async (response) => {
        setIsLoading(true);
        const backendRole = role === 'user' ? "Farmer/PetOwner" : "Veterinary Doctor";
        
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/facebook-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessToken: response.accessToken, role: backendRole })
            });
            const data = await res.json();
            
            if (res.ok) {
                toast.success("Facebook Authentication Successful!");
                // navigate("/dashboard");
            } else {
                setSubmitMessage({ text: data.message || "Facebook registration failed", isError: true });
            }
        } catch{
            setSubmitMessage({ text: "Server connection failed.", isError: true });
        } finally {
            setIsLoading(false);
        }
    };

    
    // STANDARD REGISTRATION HANDLER

    const handleSubmit = async (e) => {
        e.preventDefault(); 

        if (password !== confirmPassword) {
            setSubmitMessage({ text: "Passwords do not match!", isError: true });
            return;
        }

        setIsLoading(true); 
        setSubmitMessage({ text: "", isError: false }); 

        const backendRole = role === 'user' ? "Farmer/PetOwner" : "Veterinary Doctor";

        let payload = { firstName, lastName, email, password, contact_No: phone, role: backendRole };

        if (role === 'user') {
            
            payload.numberOfAnimals = numberOfAnimals ? parseInt(numberOfAnimals, 10) : 0;

            payload.street = street;
            payload.city = city;
            payload.state = state;
            payload.zip = zip;
            payload.country = country;

        } else {
            payload.license_number = license;
            payload.specialization = specialization;
            payload.years_of_experience = experience ? parseInt(experience, 10) : 0;
            payload.consultation_fee = fee ? parseFloat(fee) : 0.00;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json()
            if (response.status === 201) {
                toast.success("Account created successfully!");
                setFirstName(""); setLastName(""); setPhone(""); setEmail(""); setPassword(""); 
                setConfirmPassword(""); setNumberOfAnimals(""); 
                setLicense(""); setSpecialization(""); setExperience(""); setFee("");
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
                            <img src="/public/Logo.png" alt="Logo" className="w-[50px] h-[35px] mr-1 object-fill" />
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

                        <div className="h-px w-full bg-slate-100" />

                        {/* SOCIAL OAUTH BUTTONS AREA */}
                        <div className="space-y-4">
                            {/* GOOGLE BUTTON */}
                            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                                <CustomGoogleButton 
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setSubmitMessage({ text: "Google Authentication failed.", isError: true })}
                                    isLoading={isLoading}
                                />
                            </GoogleOAuthProvider>

                            {/* FACEBOOK BUTTON */}
                            <CustomFacebookButton 
                                onSuccess={handleFacebookResponse}
                                onFail={() => setSubmitMessage({ text: "Facebook Login Failed", isError: true })}
                                isLoading={isLoading}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-slate-500 font-medium">Or continue with email</span>
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
                                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" required className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" required className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="0712345678" pattern="[0-9]{10}" required className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" required className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] pr-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none">
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {password && (
                                        <div className="mt-2 flex gap-1 h-1.5 w-full">
                                            <div className={`flex-1 rounded-full ${strength >= 1 ? (strength === 1 ? 'bg-red-400' : strength === 2 ? 'bg-amber-400' : 'bg-green-500') : 'bg-slate-200'}`}></div>
                                            <div className={`flex-1 rounded-full ${strength >= 2 ? (strength === 2 ? 'bg-amber-400' : 'bg-green-500') : 'bg-slate-200'}`}></div>
                                            <div className={`flex-1 rounded-full ${strength >= 3 ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] pr-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none">
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
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
                                {/* <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Farm/Home Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your full address..." required className="w-full flex rounded-xl border border-slate-300 bg-transparent pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px]"></textarea>
                                    </div>
                                </div> */}
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
                                                <option value="large">Livestock & Large Animals</option>
                                                <option value="small">Small Pets (Dogs, Cats)</option>
                                                <option value="poultry">Poultry</option>
                                                <option value="exotic">Exotic Animals</option>
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
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-slate-300 transition-colors cursor-pointer bg-slate-50">
                                    <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                                        <Camera className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">Click to upload photo</p>
                                    <p className="text-xs text-slate-500 mt-1">JPG, PNG or GIF (max. 5MB)</p>
                                </div>
                            </div>
                        </div>

                        {/* Terms and Submit */}
                        <div className="pt-4">
                            <label className="flex items-start gap-3 mb-6 cursor-pointer group">
                                <div className="relative flex items-center justify-center mt-0.5">
                                    <input type="checkbox" required className="peer sr-only" />
                                    <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-green-600 peer-checked:border-green-600 transition-colors"></div>
                                    <CheckCircle2 className="absolute text-white w-3 h-3 opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <span className="text-sm text-slate-600 leading-relaxed">
                                    I agree to the <Link to="#" className="text-green-600 font-semibold hover:underline">Terms & Conditions</Link> and <Link to="#" className="text-green-600 font-semibold hover:underline">Privacy Policy</Link>, and consent to the processing of my data.
                                </span>
                            </label>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className={`w-full h-14 rounded-xl text-lg text-white shadow-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${
                                    role === 'vet' 
                                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' 
                                    : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                                } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    "Creating Account..."
                                ) : (
                                    "Create Account"
                                )}
                            </button> 
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
                    src={role === 'vet' ? "/public/vetcat.jpg" : "https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=1974&auto=format&fit=crop"} 
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