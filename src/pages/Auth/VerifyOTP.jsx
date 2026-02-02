import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";
import API_URL from "../../config/api";

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get email, fullName, and uid from navigation state
    const email = location.state?.email || "";
    const fullName = location.state?.fullName || "";
    const [storedUid, setStoredUid] = useState(location.state?.uid || null);

    // Log the state for debugging
    useEffect(() => {
        console.log("VerifyOTP - Navigation state:", location.state);
        console.log("VerifyOTP - Email:", email);
        console.log("VerifyOTP - UID:", storedUid);
    }, [location.state, email, storedUid]);

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const inputRefs = useRef([]);

    // Redirect if no email provided
    useEffect(() => {
        if (!email) {
            navigate("/register", { replace: true });
        }
    }, [email, navigate]);

    // Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    // Handle OTP input change
    const handleChange = (index, value) => {
        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return;

        const newOtp = [...otp];

        // Handle paste
        if (value.length > 1) {
            const pastedOtp = value.slice(0, 6).split("");
            pastedOtp.forEach((digit, i) => {
                if (index + i < 6) {
                    newOtp[index + i] = digit;
                }
            });
            setOtp(newOtp);
            // Focus on the next empty input or last input
            const nextIndex = Math.min(index + pastedOtp.length, 5);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        newOtp[index] = value;
        setOtp(newOtp);
        setError("");

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle backspace
    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Verify OTP
    const handleVerify = async () => {
        const otpCode = otp.join("");

        if (otpCode.length !== 6) {
            setError("Please enter the complete 6-digit code");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_URL}/api/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: otpCode, uid: storedUid })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess("Email verified successfully! Redirecting to login...");
                setTimeout(() => {
                    navigate("/", { replace: true });
                }, 2000);
            } else {
                setError(data.message || "Failed to verify code. Please try again.");
                setOtp(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            }
        } catch (error) {
            console.error("Verification error:", error);
            setError("Failed to verify code. Please try again.");
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResend = async () => {
        if (cooldown > 0) return;

        try {
            setResending(true);
            setError("");

            const response = await fetch(`${API_URL}/api/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, fullName, uid: storedUid })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess("New verification code sent to your email!");
                setCooldown(60); // 60 second cooldown
                setOtp(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();

                // Clear success message after 5 seconds
                setTimeout(() => setSuccess(""), 5000);
            } else {
                setError(data.message || "Failed to resend code. Please try again.");
            }
        } catch (error) {
            console.error("Resend error:", error);
            setError("Failed to resend code. Please try again.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-400 to-purple-500 p-4 overflow-auto">
            <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-8 shadow-2xl my-auto">

                {/* HEADER */}
                <div className="mb-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <Mail className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Verify Your Email</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        We've sent a 6-digit code to
                    </p>
                    <p className="text-sm font-medium text-indigo-600 mt-1">
                        {email}
                    </p>
                </div>

                {/* SUCCESS MESSAGE */}
                {success && (
                    <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}

                {/* ERROR MESSAGE */}
                {error && (
                    <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* OTP INPUT */}
                <div className="mb-6">
                    <div className="flex justify-center gap-2 sm:gap-3">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold text-gray-800 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                disabled={loading || success}
                            />
                        ))}
                    </div>
                </div>

                {/* VERIFY BUTTON */}
                <button
                    onClick={handleVerify}
                    disabled={loading || success || otp.join("").length !== 6}
                    className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Verifying..." : success ? "Verified!" : "Verify Email"}
                </button>

                {/* RESEND */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 mb-2">
                        Didn't receive the code?
                    </p>
                    <button
                        onClick={handleResend}
                        disabled={resending || cooldown > 0 || success}
                        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw size={16} className={resending ? "animate-spin" : ""} />
                        {cooldown > 0
                            ? `Resend in ${cooldown}s`
                            : resending
                                ? "Sending..."
                                : "Resend Code"
                        }
                    </button>
                </div>

                {/* BACK TO LOGIN */}
                <p className="mt-6 text-center text-sm text-gray-500">
                    <button
                        onClick={() => navigate("/")}
                        className="font-medium text-indigo-600 hover:underline"
                    >
                        Back to Login
                    </button>
                </p>
            </div>
        </div>
    );
};

export default VerifyOTP;
