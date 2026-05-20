import { Briefcase, Camera, CheckCircle2, Circle, DollarSign, Eye, EyeOff, HeartPulse, Lock, Mail, MapPin, Parentheses, Phone, ShieldCheck, Stethoscope, User } from "lucide-react";
import { useState } from "react";
import { CiHeart } from "react-icons/ci";
import { TbStethoscope } from "react-icons/tb";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";


export default function RegisterPage() {
    // --- States for Form Data ---
    const [role, setRole] = useState('user');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    // User-specific states
    const [address, setAddress] = useState("");
    const [numberOfAnimals, setNumberOfAnimals] = useState(""); 
    
    // Vet-specific states 
    const [license, setLicense] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [experience, setExperience] = useState("");
    const [fee, setFee] = useState("");

    // --- States for UI Toggles and Messages ---
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({ text: "", isError: false });

    // --- Calculate password strength ---
    const getPasswordStrength = () => {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };
    const strength = getPasswordStrength();

    // --- Form Submission Function ---
    const handleSubmit = async (e) => {
        e.preventDefault(); 

        if (password !== confirmPassword) {
            setSubmitMessage({ text: "Passwords do not match!", isError: true });
            return;
        }

        setIsLoading(true); 
        setSubmitMessage({ text: "", isError: false }); 

        const backendRole = role === 'user' ? "Farmer/PetOwner" : "Veterinary Doctor";

        // 1. Create the base payload with shared information
        let payload = {
            fullName: fullName,
            email: email,
            password: password,
            contact_No: phone,
            role: backendRole,
        };

        // 2. Add role-specific data and convert numbers for the database
        if (role === 'user') {
            payload.address = address;
            payload.numberOfAnimals = numberOfAnimals ? parseInt(numberOfAnimals, 10) : 0;
        } else {
            payload.license_number = license;
            payload.specialization = specialization;
            payload.years_of_experience = experience ? parseInt(experience, 10) : 0;
            payload.consultation_fee = fee ? parseFloat(fee) : 0.00;
        }

        try {
            const response = await fetch("http://localhost:5000/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.status === 201) {
                setSubmitMessage({ text: "Account created successfully!", isError: false });
                toast.success("Account created successfully!");
                
                // Clear form after success
                setFullName(""); setPhone(""); setEmail(""); setPassword(""); 
                setConfirmPassword(""); setAddress(""); setNumberOfAnimals(""); 
                setLicense(""); setSpecialization(""); setExperience(""); setFee("");
            } else {
                setSubmitMessage({ text: result.message || "Registration failed", isError: true });
                toast.error(result.message);
            }
        } catch {
            setSubmitMessage({ text: "Server connection failed. Is your backend running?", isError: true });
            toast.error("Server connection failed.");
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

                    {/* MAIN FORM */}
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

                        {/* Social Registration Buttons */}
                        <div className="space-y-4">
                            <button
                                type="button"
                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                <span className="font-medium text-slate-700">Continue with Google</span>
                            </button>

                            <button
                                type="button"
                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#1877F2] border-2 border-[#1877F2] rounded-xl hover:bg-[#166FE5] transition-all shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                <span className="font-medium text-white">Continue with Facebook</span>
                            </button>
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter Your Full Name" required className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="0712345678" pattern="[0-9]{10}" required className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" />
                                    </div>
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
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Farm/Home Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your full address..." required className="w-full flex rounded-xl border border-slate-300 bg-transparent pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px]"></textarea>
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
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </button> 
                        </div>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-600">
                        Already have an account?{' '}
                        <Link to="/login" className={`font-semibold ${role === 'vet' ? 'text-blue-600 hover:text-blue-700 focus:ring-blue-500' : 'text-green-600 hover:text-green-700 focus:ring-green-500'}`}>
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