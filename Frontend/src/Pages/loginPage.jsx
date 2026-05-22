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

export default function LoginPage() {

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

    function handleLogin() {
      if (role === "farmer") {
        navigate("/farmer-dashboard");
      } else if (role === "doctor") {
        navigate("/doctor-dashboard");
      } else if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        toast.error("Please select a role");
      }
    }

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
                <div className="text-secondary text-[24px] font-bold font-[Inter] text-left flex items-center mb-[10px]">
                  <img src="/public/Logo.png" className="w-[50px] h-[35px] mr-1 object-fill" />
                  VetCloud
                </div>

                <div className="text-secondary text-[30px] font-bold ">Welcome back!</div>

                <p className="text-[#62748E] text-[14px] font-[Inter] italic font-normal mt-[2px]">Access veterinary care anytime, anywhere.</p>

                <p className="text-[#45556C] text-[14px] font-[Inter] font-normal mt-[10px]">Sign in as</p>

                {/* user section */}
                <div className="flex flex-wrap justify-between mt-[6px]">  
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

                <div className="w-full flex flex-wrap justify-between mb-[10px]">
                  <button className="w-[48%] h-[40px] border  border-[#E2E8F0] text-[#314158] font-Inter font-normal text-[14px] rounded-[14px] flex justify-center items-center"><FcGoogle className="w-[18px] h-[18px] mr-[9px]" />Google</button>  
                  <button className="w-[48%] h-[40px] border  border-[#E2E8F0] text-[#314158] font-Inter font-normal text-[14px] rounded-[14px] flex justify-center items-center"><FaFacebook className="w-[18px] h-[18px] mr-[9px]" />Facebook</button>
                </div>


                <button onClick={handleLogin} className="w-full h-[40px] bg-accent text-[16px] font-Inter font-medium text-white rounded-[25px] cursor-pointer">
                          Login to Dashboard
                </button>

                <p className="mt-[5px] text-gray flex justify-center items-center text-[14px] font-[Inter] font-normal">
                        Don't have an account? 
                        <Link to="/register" className="text-accent font-normal hover:underline ml-1">
                        Register here
                        </Link>
                </p>

            </div>
        </div>
      </div>

    </div>
    

    )
}