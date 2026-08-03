import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  HeartPulse,
  ArrowRight,
  ArrowLeft,
  Shield
} from 'lucide-react';

import { Button, Input } from '../components/Ui/ui';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    try {

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return setError(data.message);
      }

      setSuccess(data.message);
      setError("");

      setTimeout(() => {
        setStep("otp");
      }, 1500);

    } catch {
      setError("Server connection failed");
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {

    e.preventDefault();

    const otpCode = otp.join("");

    try {

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            otp: otpCode
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return setError(data.message);
      }

      setSuccess(data.message);
      setError("");

      setTimeout(() => {
        setStep("reset");
      }, 1500);

    } catch {
      setError("Server connection failed");
    }
  };

  const handlePasswordReset = async (e) => {

    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            newPassword
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return setError(data.message);
      }

      setSuccess(data.message);

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch {
      setError("Server connection failed");
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return setError(data.message);
      }

      setSuccess('A new verification code has been sent to your email.');
      setError('');
      setOtp(['', '', '', '', '', '']);

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch {
      setError("Server connection failed");
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-green-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/80 to-blue-900/90 mix-blend-multiply z-10" />

        {/* <img
          src="https://images.unsplash.com/photo-1596531398867-0c1453258c73?q=80&w=2070&auto=format&fit=crop"
          alt="Veterinary Care"
          className="absolute inset-0 w-full h-full object-cover"
        /> */}

        <div className="relative z-20 flex flex-col justify-end p-12 text-white h-full">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 max-w-lg">
            <h2 className="text-3xl font-bold mb-4">
              Secure Account Recovery
            </h2>

            <p className="text-green-50 text-lg">
              We'll help you regain access to your account securely.
              Follow the simple steps to reset your password.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12 bg-white">
        <div className="max-w-md w-full mx-auto">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group mb-12 w-fit">
            <div className="text-secondary text-[24px] font-bold font-[Inter] text-left flex items-center mb-[10px]">
                <img src="/public/Logo.png" className="w-[50px] h-[35px] mr-1 object-fill" />
                VetCloud
            </div>
          </Link>

          {/* Back */}
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 w-fit transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">

            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step === 'email'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                1
              </div>

              <div
                className={`h-0.5 w-12 ${
                  step !== 'email'
                    ? 'bg-green-600'
                    : 'bg-slate-200'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step === 'otp'
                    ? 'bg-green-600 text-white'
                    : step === 'reset'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                2
              </div>

              <div
                className={`h-0.5 w-12 ${
                  step === 'reset'
                    ? 'bg-green-600'
                    : 'bg-slate-200'
                }`}
              />
            </div>

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === 'reset'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              3
            </div>
          </div>

          {/* EMAIL STEP */}
          {step === 'email' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Forgot Password?
                </h1>

                <p className="text-slate-500">
                  Enter your email address and we'll send you a
                  verification code to reset your password.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 text-green-600 text-sm font-medium rounded-xl border border-green-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {success}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-5">

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>

                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="pl-11 h-12 rounded-xl border-slate-200 focus:border-green-500 focus:ring-green-500/20 shadow-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 rounded-xl text-base mt-2 shadow-sm"
                >
                  Send Verification Code

                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </>
          )}

          {/* OTP STEP */}
          {step === 'otp' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Enter Verification Code
                </h1>

                <p className="text-slate-500">
                  We've sent a 6-digit code to{' '}
                  <span className="font-semibold text-slate-700">
                    {email}
                  </span>
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 text-green-600 text-sm font-medium rounded-xl border border-green-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {success}
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-6">

                <div className="flex gap-2 justify-between">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) =>
                        handleOtpChange(index, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Backspace' &&
                          !digit &&
                          index > 0
                        ) {
                          document
                            .getElementById(`otp-${index - 1}`)
                            ?.focus();
                        }
                      }}
                      className="w-full h-14 text-center text-xl font-semibold rounded-xl border-slate-200 focus:border-green-500 focus:ring-green-500/20 shadow-sm"
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 rounded-xl text-base shadow-sm"
                >
                  Verify Code

                  <Shield className="ml-2 h-5 w-5" />
                </Button>

                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    Didn't receive the code?{' '}

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="font-semibold text-green-600 hover:text-green-700 transition-colors"
                    >
                      Resend
                    </button>
                  </p>
                </div>
              </form>
            </>
          )}

          {/* RESET STEP */}
          {step === 'reset' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Create New Password
                </h1>

                <p className="text-slate-500">
                  Enter a strong password to secure your account.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 text-green-600 text-sm font-medium rounded-xl border border-green-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {success}
                </div>
              )}

              <form onSubmit={handlePasswordReset} className="space-y-5">

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    New Password
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>

                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(e.target.value)
                      }
                      placeholder="Enter new password"
                      className="pl-11 pr-11 h-12 rounded-xl border-slate-200 focus:border-green-500 focus:ring-green-500/20 shadow-sm"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(!showNewPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm New Password
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>

                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      placeholder="Confirm password"
                      className="pl-11 pr-11 h-12 rounded-xl border-slate-200 focus:border-green-500 focus:ring-green-500/20 shadow-sm"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 rounded-xl text-base mt-2 shadow-sm"
                >
                  Reset Password

                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}