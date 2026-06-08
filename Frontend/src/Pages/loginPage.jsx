import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaRegHeart} from "react-icons/fa";
import { PiEyeLight, PiEyeSlash } from "react-icons/pi";
import { LuLock } from "react-icons/lu";
import { HiOutlineMail } from "react-icons/hi";
import { CiHeart } from "react-icons/ci";
import { TbStethoscope } from "react-icons/tb";
import { MdOutlineShield } from "react-icons/md";
import toast from "react-hot-toast";
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';

export default function LoginPage() {

    const [show2FA, setShow2FA] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [tempLoginData, setTempLoginData] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [role, setRole] = useState(null);

    const buttonStyle = (value) => `
    group min-w-[120px] h-[70px] border text-[11.2px] rounded-lg 
    flex flex-col justify-center items-center text-center
    transition-all duration-300 active:scale-95

    ${
      role === value
        ? "border-green-500 text-green-600 bg-green-50 shadow-lg scale-105"
        : "border-[#E2E8F0] text-secondary hover:border-green-500 hover:text-green-600 hover:bg-green-50 hover:shadow-md"
    }
  `;

  const iconStyle = (value) => `
    w-[25px] h-[25px] flex justify-center items-center rounded-[10px] 
    shadow-md mb-[8px] transition-all duration-300

    ${
      role === value
        ? "bg-green-600"
        : "bg-[#afb1b3] group-hover:bg-green-600"
    }`;


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
        if (!role) return toast.error("Please select a role first!");
        setIsLoading(true);
        
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/google-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: tokenResponse.access_token, role: role === 'farmer' ? "Farmer/PetOwner" : role === 'doctor' ? "Veterinary Doctor" : "Admin" }) 
            });
            const data = await response.json();
            
            if (response.ok) {
                toast.success("Google Login Successful!");
                if (data.token) localStorage.setItem("token", data.token); // Save session
                if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
                
                // Route to correct dashboard
                if (role === "farmer") navigate("/dashboard/user");
                if (role === "doctor") navigate("/dashboard/doctor");
                if (role === "admin") navigate("/dashboard/admin");
            } else {
                toast.error(data.message || "Google login failed");
            }
        } catch {
            toast.error("Server connection failed.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- FACEBOOK LOGIN HANDLER ---
    const handleFacebookResponse = async (response) => {
        if (!role) return toast.error("Please select a role first!");
        setIsLoading(true);
        
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/facebook-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: response.accessToken, role: role === 'farmer' ? "Farmer/PetOwner" : role === 'doctor' ? "Veterinary Doctor" : "Admin" })
            });
            const data = await res.json();
            
            if (res.ok) {
                toast.success("Facebook Login Successful!");
                if (data.token) localStorage.setItem("token", data.token); // Save session
                if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
                // Route to correct dashboard
                if (role === "farmer") navigate("/dashboard/user");
                if (role === "doctor") navigate("/dashboard/doctor");
                if (role === "admin") navigate("/dashboard/admin");
            } else {
                toast.error(data.message || "Facebook login failed");
            }
        } catch {
            toast.error("Server connection failed.");
        } finally {
            setIsLoading(false);
        }
    };

  
    // Paste this right above your main LoginPage component
    const InlineGoogleButton = ({ onSuccess, disabled }) => {
        const login = useGoogleLogin({
            onSuccess: onSuccess,
            onError: () => toast.error("Google Authentication failed.")
        });

        return (
            <button 
                type="button"
                onClick={() => login()}
                disabled={disabled}
                // Your exact styling, plus a hover/active effect for click physics
                className="w-full h-[40px] border border-[#E2E8F0] text-[#314158] font-Inter font-normal text-[14px] rounded-[14px] flex justify-center items-center hover:bg-slate-50 active:scale-95 transition-all shadow-sm disabled:opacity-70"
            >
                <FcGoogle className="w-[18px] h-[18px] mr-[9px]" />Google
            </button>
        );
    };

    return (
    <div className='w-full h-screen bg-primary flex'>
      <div className="w-[50%] h-full bg-gradient-to-br from-[rgba(0,166,62,0.80)] to-[rgba(28,57,142,0.90)] relative">
        <div className="w-[512px] h-[202px] backdrop-blur-md bg-white/15 border border-white/30 rounded-[16px] shadow-lg absolute bottom-[48px] left-[48px]">
          <div className="w-full h-full p-[33px] flex flex-col justify-center">
            <h1 className="font-Inter text-[28px] text-white font-medium leading-[36px] mb-[17px]">Empowering Animal Health</h1>
            <p className="text-left text-[#F0FDF4] font-Inter font-light leading-[28px]">Connect with certified veterinary professionals<br /> instantly. The best care for your livestock and pets<br /> is just a click away.</p>
          </div>
        </div>
      </div>

      <div className="w-[50%] h-full bg-primary flex items-center justify-center">
        <div className='w-[77%] h-[96%] backdrop-blur-lg rounded-lg shadow-2xl flex flex-col items-center justify-center'>
            <div className="w-[80%] flex flex-col pt-2">
                {show2FA ? (
                    /* --- THE 2FA SCREEN --- */
                    <form onSubmit={handleSubmit2FA} className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in-up mt-10">
                        <div className="w-[60px] h-[60px] bg-green-50 rounded-full flex items-center justify-center mb-2">
                            <MdOutlineShield className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-[28px] font-bold text-secondary font-Inter text-center">Security Verification</h2>
                        <p className="text-center text-[#62748E] text-[14px] font-Inter mb-8">
                            Enter the 6-digit code from your Authenticator app to continue.
                        </p>
                        
                        <div className="w-full">
                            <input 
                                type="text" 
                                maxLength="6"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                placeholder="000000"
                                className="w-full h-[60px] px-4 py-3 text-center tracking-[0.7em] text-3xl font-bold rounded-[14px] border border-gray-300 shadow-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-slate-700"
                                required
                                autoFocus
                            />
                        </div>
                        
                        <button type="submit" className="w-full h-[45px] mt-6 bg-accent hover:bg-green-700 text-[16px] font-Inter font-medium text-white rounded-[25px] cursor-pointer transition-all duration-200 active:scale-95 shadow-md">
                            Verify & Login
                        </button>
                        
                        <button type="button" onClick={() => setShow2FA(false)} className="w-full py-2 text-gray-500 text-[14px] font-Inter hover:text-gray-700 transition-colors">
                            Cancel & Go Back
                        </button>
                    </form>
                ) : (
                    /* --- THE NORMAL LOGIN SCREEN --- */
                    <>
                        <div className="text-secondary text-[24px] font-bold font-[Inter] text-left flex items-center mb-[10px]">
                        <img src="/public/Logo.png" className="w-[50px] h-[35px] mr-1 object-fill" alt="VetCloud Logo" />
                        VetCloud
                        </div>

                        <div className="text-secondary text-[30px] font-bold ">Welcome back!</div>

                        <p className="text-[#62748E] text-[14px] font-[Inter] italic font-normal mt-[2px]">Access veterinary care anytime, anywhere.</p>

                        <p className="text-[#45556C] text-[14px] font-[Inter] font-normal mt-[10px]">Sign in as</p>

                        {/* user section */}
                        <div className="flex flex-wrap justify-between mt-[6px] font-bold">  
                        <div className="min-w-[120px] h-[70px]" >
                            <button onClick={() => setRole("farmer")} className={buttonStyle("farmer")}>
                            <div className={iconStyle("farmer")}>
                                <CiHeart className="h-[20px] w-[20px] text-white" />
                            </div>
                            Pet Owner / Farmer
                            </button>
                        </div>

                        <div className="min-w-[120px] h-[70px]" >
                            <button onClick={() => setRole("doctor")} className={buttonStyle("doctor")}>
                            <div className={iconStyle("doctor")}>
                                <TbStethoscope className="h-[18px] w-[18px] text-white" />
                            </div>
                            Veterinary Doctor
                            </button>
                        </div>

                        <div className="min-w-[120px] h-[70px]" >
                            <button onClick={() => setRole("admin")} className={buttonStyle("admin")}>
                            <div className={iconStyle("admin")}>
                                <MdOutlineShield className="h-[20px] w-[20px] text-white" />
                            </div>
                            Administrator
                            </button>
                        </div> 
                        </div>

                        {/* Email Input */}
                        <p className="text-secondary mt-[10px] font-[Inter] font-medium text-[14px] mb-[8.5px]">Email Address</p>

                        <div className="relative w-full">

                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            <HiOutlineMail />
                        </span>

                        <input type="Email"
                            onChange={
                                (e)=>
                                    {
                                        setEmail(e.target.value);
                                }}   
                            placeholder="Enter Your Email" 
                            className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" 
                        />
                        </div>
                        
                        {/* Password Field */}
                        <div className="flex flex-row justify-between items-center font-[Inter] font-medium text-[14px] mt-[10px] mb-[5px]">
                        <p className="text-secondary">Password</p>
                        <p className="text-gray italic">
                                <Link to="/forgot-password" className="text-accent font-normal hover:underline">
                                Forgot Password?
                                </Link>
                        </p>
                        </div>

                        <div className="relative w-full">

                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            <LuLock />
                        </span>
            
                        <input
                            type={showPassword ? "text" : "password"}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your Password"
                            className="w-full h-[50px] rounded-[14px] border border-gray-300 shadow-sm pl-[40px] pr-[40px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500"
                        />

                        <span
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
                        >
                            {showPassword ? <PiEyeLight /> : <PiEyeSlash /> }
                        </span>

                        </div>

                        <div className="flex items-center my-3">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="mx-3 text-gray-500 font-[Inter] font-normal text-[12px]">or continue with</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                        </div>
                        
                        {/* google and facebook login buttons */}
                        <div className="w-full flex flex-wrap justify-between mb-[10px]">
                        
                        <div className="w-[48%]">
                            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                                <InlineGoogleButton 
                                    onSuccess={handleGoogleSuccess} 
                                    disabled={isLoading} 
                                />
                            </GoogleOAuthProvider>
                        </div>

                        {/* FACEBOOK INLINE BUTTON */}
                        <div className="w-[48%]">
                            <FacebookLogin.default
                                appId={import.meta.env.VITE_FACEBOOK_APP_ID}
                                onSuccess={handleFacebookResponse}
                                onFail={() => toast.error("Facebook Login Failed")}
                                render={({ onClick }) => (
                                    <button
                                        type="button"
                                        onClick={onClick}
                                        disabled={isLoading}
                                        className="w-full h-[40px] border border-[#E2E8F0] text-[#314158] font-Inter font-normal text-[14px] rounded-[14px] flex justify-center items-center hover:bg-slate-50 active:scale-95 transition-all shadow-sm disabled:opacity-70"
                                    >
                                        <FaFacebook className="w-[18px] h-[18px] mr-[9px] text-[#1877F2]" />Facebook
                                    </button>
                                )}
                            />
                        </div>
                        </div>


                        <button onClick={handleLogin} className="w-full h-[40px] bg-accent hover:bg-green-700 text-[16px] font-Inter font-medium text-white rounded-[25px] cursor-pointer transition-all duration-200 active:scale-95">
                                Login to Dashboard
                        </button>

                        <p className="mt-[5px] text-gray flex justify-center items-center text-[14px] font-[Inter] font-normal">
                                Don't have an account? 
                                <Link to="/register" className="text-accent font-normal hover:underline ml-1">
                                Register here
                                </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
    

    )
}