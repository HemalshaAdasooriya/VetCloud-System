import { Briefcase, Camera, CheckCircle2, DollarSign, Eye, EyeOff, HeartPulse, Lock, Mail, MapPin, Phone, ShieldCheck, Stethoscope, User } from "lucide-react";
import { useState } from "react";
import { CiHeart } from "react-icons/ci";
import { TbStethoscope } from "react-icons/tb";
import { Link } from "react-router-dom";


export default function RegisterPage(){
    const [role, setRole] = useState(null);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState();
    const [password, setPassword] = useState("");
    

    // Calculate password strength
  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };
  const strength = getPasswordStrength();

  
    

    return (
    <div className="w-full min-h-screen bg-primary flex">
        {/* Left Side - Registration Form */}
        <div className="w-full xl:w-7/12 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12 bg-white overflow-y-auto">
            <div className="max-w-xl w-full py-8 font-[Inter]">
                    {/* logo */}
                    <Link to="/" className="flex items-center gap-2 group mb-10 w-fit">
                        <div>
                        <img src="/public/Logo.png" className="w-[50px] h-[35px] mr-1 object-fill" />
                        </div>
                        <span className="text-2xl font-bold text-slate-800 tracking-tight">VetCloud</span>
                    </Link>
                    
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create an Account</h1>
                        <p className="text-slate-500 mb-8">Join VetCloud to access professional veterinary care.</p>
                    </div>

                <form className="space-y-8">
                    {/* 1. Role Selection */}
                        <div className="space-y-3">
                        <label className="block text-sm font-bold text-slate-800">I am registering as a:</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label 
                                className={`cursor-pointer flex flex-col items-center p-4 border-2 rounded-2xl transition-all duration-300 active:scale-95 ${
                                    role === 'user' ? 'border-green-600 bg-green-50' : 'border-slate-200 hover:border-green-200 bg-white'
                                }`}
                                >
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value="user" 
                                    checked={role === 'user'} 
                                    onChange={() => setRole('user')} 
                                    className="sr-only"
                                />
                                <User size={32} className={`mb-2 ${role === 'user' ? 'text-green-600' : 'text-slate-400'}`} />
                                <span className={`font-semibold ${role === 'user' ? 'text-green-800' : 'text-slate-600'}`}>Pet Owner / Farmer</span>
                                </label>
                                
                                <label 
                                className={`cursor-pointer flex flex-col items-center p-4 border-2 rounded-2xl transition-all duration-300 active:scale-95 ${
                                    role === 'vet' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-200 bg-white'
                                }`}
                                >
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value="vet" 
                                    checked={role === 'vet'} 
                                    onChange={() => setRole('vet')} 
                                    className="sr-only"
                                />
                                <Stethoscope size={32} className={`mb-2 ${role === 'vet' ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span className={`font-semibold ${role === 'vet' ? 'text-blue-800' : 'text-slate-600'}`}>Veterinary Doctor</span>
                                </label>
                            </div>
                        </div>
                    
                    <div className="h-px w-full bg-slate-100" />
                    {/* 2. Basic Information */}
                    <div className="space-y-5">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                            Basic Information
                        </h3>

                        {/* full name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input type="text"
                                            id="name-input"
                                            value={fullName}
                                            onChange={
                                                (e)=>
                                                    {
                                                        setFullName(e.target.value);
                                                    }}   
                                            placeholder="Enter Your Full Name" 
                                            className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" 
                                    />
                                </div>
                            </div>
                            {/* contact number */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input type="tel"
                                            id="phone"
                                            value={phone}
                                            onChange={
                                                (e)=>
                                                    {
                                                        const value = e.target.value.replace(/\D/g, "");
                                                        setPhone(value);
                                                    }}   
                                            placeholder="+1 (555) 000-0000" 
                                            pattern="[0-9]{10}"
                                            className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" 
                                        />
                                    </div>
                                </div>
                            </div>

                        {/* email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                            <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input type="email"
                                    onChange={
                                        (e)=>
                                            {
                                                setEmail(e.target.value);
                                            }}   
                                    placeholder="john@example.com" 
                                    className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" 
                                />
                            </div>
                        </div>
                        {/* password */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input type={showPassword ? "text" : "password"} 
                                        value={password}
                                        onChange={
                                            (e)=>
                                                {
                                                    setPassword(e.target.value);
                                                }}   
                                        placeholder="••••••••" 
                                        className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] pr-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" 
                                        required 
                                />
                                <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {/* Password Strength Indicator */}
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
                                    <input type={showConfirmPassword ? "text" : "password"} 
                                            value={showConfirmPassword}
                                            onChange={
                                                (e)=>
                                                    {
                                                        setShowConfirmPassword(e.target.value);
                                                    }}   
                                            placeholder="••••••••" 
                                            className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] pr-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" 
                                            required 
                                    />
                                    <button 
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                    >
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
                                <textarea 
                                    placeholder="Enter your full address..." 
                                    className="w-full flex rounded-xl border border-slate-300 bg-transparent pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px]"
                                    required
                                ></textarea>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Approximate Number of Animals (Optional)</label>
                                <input type="number" placeholder="e.g., 20" className="w-50% h-12 rounded-xl border border-slate-300 bg-transparent pl-4 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                            </>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Veterinary License Number</label>
                                <div className="relative">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input type="text" placeholder="Enter your license number" className="w-full h-12 rounded-xl border border-slate-300 bg-transparent pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialization</label>
                                <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <select className="w-full h-12 rounded-xl border border-slate-300 bg-transparent pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer">
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
                                <input type="number" placeholder="e.g., 5" className="w-full h-12 rounded-xl border border-slate-300 bg-transparent pl-4 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Standard Consultation Fee ($)</label>
                                <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input type="number" placeholder="e.g., 45.00" className="w-full h-12 rounded-xl border border-slate-300 bg-transparent pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
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

                        <button type="submit" className={`w-full h-14 rounded-xl text-lg text-white shadow-sm ${role === 'vet' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-green-600 hover:bg-green-700'}`}>Create Account</button>  
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
    )
}