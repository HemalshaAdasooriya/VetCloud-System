import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { useState } from "react";
import { CiHeart } from "react-icons/ci";
import { TbStethoscope } from "react-icons/tb";


export default function RegisterPage(){
    const [role, setRole] = useState(null);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    

    const buttonStyle = (value) => `
    group min-w-[320px] h-[90px] border text-[11.2px] rounded-lg 
    flex flex-col justify-center items-center text-center
    transition-all duration-300 active:scale-95

    ${
      role === value
        ? "border-green-500 text-green-600 bg-green-50 shadow-lg scale-105"
        : "border-[#E2E8F0] text-secondary hover:border-green-500 hover:text-green-600 hover:bg-green-50 hover:shadow-md"
    }
  `;

    const iconStyle = (value) => `
    w-[30px] h-[30px] flex justify-center items-center rounded-[10px] 
    shadow-md mb-[8px] transition-all duration-300

    ${
      role === value
        ? "bg-green-600"
        : "bg-[#afb1b3] group-hover:bg-green-600"
    }`;

    const buttonStyleBlue = (value) => `
    group min-w-[320px] h-[90px] border text-[11.2px] rounded-lg 
    flex flex-col justify-center items-center text-center
    transition-all duration-300 active:scale-95

    ${
      role === value
        ? "border-[#155DFC]-500 text-[#155DFC]-600 bg-blue-100 shadow-lg scale-105"
        : "border-[#E2E8F0] text-secondary hover:border-blue-500 hover:text-[#155DFC]-600 hover:bg-blue-50 hover:shadow-md"
    }
  `;

    const iconStyleBlue = (value) => `
    w-[30px] h-[30px] flex justify-center items-center rounded-[10px] 
    shadow-md mb-[8px] transition-all duration-300

    ${
      role === value
        ? "bg-blue-600"
        : "bg-[#afb1b3] group-hover:bg-blue-600"
    }`;

    

    return (
        <div className="w-full h-screen bg-primary flex">
            <div className="w-[calc(100%-560px)] h-full bg-primary flex justify-center items-center">
                <div className="w-full h-full py-[48px] px-[200px] font-[Inter] text-left justify-center flex flex-col">
                    
                    <div className="text-secondary text-[24px] font-bold font-[Inter] text-left flex items-center">
                        <img src="/public/Logo.png" className="w-[50px] h-[35px] mr-1 object-fill" />
                        VetCloud
                    </div>

                    <div className="text-secondary font-[Inter] text-left items-center mt-[30px]">
                        <h1 className="text-[30px] font-bold mb-[5px]">Create an Account</h1>
                        <p className="text-[#62748E] text-[16px]">Join VetCloud to access professional veterinary care.</p>
                    </div>

                    <div className="text-secondary mt-[34px]">
                        <p className="text-[#1D293D] font-bold mb-[12px]">I am registering as a:</p>
                    </div>

                    {/* 1. Role Selection */}
                    <div className="flex flex-wrap justify-between mt-[6px] pb-[32px]">
                        <div className="min-w-[120px] h-[70px]" >
                            <button onClick={() => setRole("farmer")} className={buttonStyle("farmer")}>
                                <div className={iconStyle("farmer")}>
                                    <CiHeart className="h-[20px] w-[20px] text-white " />
                                </div>
                                <p className="text-[14px] font-[500]">Pet Owner / Farmer</p>
                            </button>
                        </div>

                        <div className="min-w-[380px] h-[70px]" >
                            <button onClick={() => setRole("doctor")} className={buttonStyleBlue("doctor")}>
                                <div className={iconStyleBlue("doctor")}>
                                    <TbStethoscope className="h-[18px] w-[18px] text-white" />
                                </div>
                                <p className="text-[14px] font-[500]">Veterinary Doctor</p>
                            </button>
                        </div> 
                    </div>

                    {/* 2. Basic Information */}
                    <div className="space-y-5 pt-[32px]">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                            Basic Information
                        </h3>

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input 
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={
                                        (e)=>
                                            {
                                                setPassword(e.target.value);
                                            }}   
                                    placeholder="Create a password" 
                                    className="w-full h-[50px] rounded-[14px] border-[1px] shadow-sm pl-[40px] border-gray-300 p-[10px] text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500" 
                                />
                                    
                                </div>
                                {/* Password Strength Indicator */}
                                {/* {password && (
                                    <div className="mt-2 flex gap-1 h-1.5 w-full">
                                    <div className={`flex-1 rounded-full ${strength >= 1 ? (strength === 1 ? 'bg-red-400' : strength === 2 ? 'bg-amber-400' : 'bg-green-500') : 'bg-slate-200'}`}></div>
                                    <div className={`flex-1 rounded-full ${strength >= 2 ? (strength === 2 ? 'bg-amber-400' : 'bg-green-500') : 'bg-slate-200'}`}></div>
                                    <div className={`flex-1 rounded-full ${strength >= 3 ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                    </div>
                                )} */}
                            </div>
                        </div>    


                        </div>

                    </div>



                    



                </div>


            </div>

            <div className="w-[560px] h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/registerDog.jpg')] bg-center bg-cover bg-no-repeat opacity-70"></div>

                {/* Gradient overlay (stronger) */}
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,166,62,0.85)] to-[rgba(28,57,142,0.95)]"></div> 
            </div>

        </div>
    )
}