import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../../firebase/firebaseConfig";
import API_URL from "../../config/api";

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email))
            newErrors.email = "Invalid email address";
        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 6)
            newErrors.password = "Minimum 6 characters required";
        if (!formData.confirmPassword)
            newErrors.confirmPassword = "Confirm your password";
        else if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = "Passwords do not match";
        return newErrors;
    };

    // Send OTP via backend
    const sendOTP = async (email, fullName, uid = null) => {
        const response = await fetch(`${API_URL}/api/send-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, fullName, uid })
        });
        return response.json();
    };

    // ---------------- GOOGLE SIGN-IN ----------------
    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);

            // Sign in with Google popup
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user already exists by UID
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            let userRole = "user";
            let existingUserData = null;

            if (userDoc.exists()) {
                // Existing user - get their role
                existingUserData = userDoc.data();
                userRole = existingUserData.role || "user";

                // Update photoURL and provider - Google users are automatically verified
                await setDoc(userDocRef, {
                    ...existingUserData,
                    photoURL: user.photoURL || existingUserData.photoURL || null,
                    provider: existingUserData.provider === "google" ? "google" : "email,google",
                    customEmailVerified: true, // Google already verifies email
                    lastLogin: serverTimestamp()
                }, { merge: true });
            } else {
                // Check if account exists with same email (different auth method)
                const { collection, query, where, getDocs } = await import("firebase/firestore");
                const usersRef = collection(db, "users");
                const emailQuery = query(usersRef, where("email", "==", user.email));
                const emailSnapshot = await getDocs(emailQuery);

                if (!emailSnapshot.empty) {
                    // User exists with same email but different auth method
                    const existingDoc = emailSnapshot.docs[0];
                    existingUserData = existingDoc.data();
                    userRole = existingUserData.role || "user";

                    // Update existing document with Google auth info
                    await setDoc(userDocRef, {
                        ...existingUserData,
                        uid: user.uid,
                        photoURL: user.photoURL || existingUserData.photoURL || null,
                        provider: "email,google",
                        customEmailVerified: true, // Google already verifies email
                        lastLogin: serverTimestamp()
                    });
                } else {
                    // Completely new user - create Firestore document
                    // Google users are automatically verified - no OTP needed
                    await setDoc(userDocRef, {
                        uid: user.uid,
                        fullName: user.displayName || "User",
                        displayName: user.displayName || "User",
                        email: user.email,
                        photoURL: user.photoURL || null,
                        provider: "google",
                        createdAt: serverTimestamp(),
                        role: "user",
                        customEmailVerified: true // Google already verifies email - no OTP needed
                    });
                }
            }

            // Google users are automatically verified - proceed directly to login
            const token = await user.getIdToken();

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || "User",
                photoURL: user.photoURL || null,
                role: userRole
            }));

            if (userRole === "admin") {
                navigate("/admin-home", { replace: true });
            } else {
                navigate("/home", { replace: true });
            }

        } catch (error) {
            console.error("Google Sign-In Error:", error);
            let errorMessage = "Google Sign-In failed";

            switch (error.code) {
                case "auth/popup-closed-by-user":
                    errorMessage = "Sign-in popup was closed";
                    break;
                case "auth/cancelled-popup-request":
                    errorMessage = "Sign-in was cancelled";
                    break;
                case "auth/popup-blocked":
                    errorMessage = "Sign-in popup was blocked by browser";
                    break;
                case "auth/account-exists-with-different-credential":
                    errorMessage = "An account already exists with the same email";
                    break;
                default:
                    errorMessage = error.message || "Google Sign-In failed";
            }
            setErrors({ general: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length) {
            setErrors(validationErrors);
            return;
        }
        try {
            setLoading(true);

            // Check if user already exists in Firestore with this email
            const { collection, query, where, getDocs } = await import("firebase/firestore");
            const usersRef = collection(db, "users");
            const emailQuery = query(usersRef, where("email", "==", formData.email));
            const emailSnapshot = await getDocs(emailQuery);

            if (!emailSnapshot.empty) {
                const existingUser = emailSnapshot.docs[0].data();
                const provider = existingUser.provider || "another method";
                setErrors({
                    general: `An account with this email already exists. ${provider === "google" ? "Please sign in with Google instead." : "Please log in instead."}`
                });
                setLoading(false);
                return;
            }

            // Create user with Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const user = userCredential.user;

            // Update the user's display name
            await updateProfile(user, {
                displayName: formData.fullName
            });

            // Don't store user data in Firestore yet - it will be stored after OTP verification
            // The backend will create the user document when OTP is verified

            // Send OTP via backend (pass UID so Firestore doc uses same ID as Auth user)
            const otpResult = await sendOTP(formData.email, formData.fullName, user.uid);

            if (!otpResult.success) {
                setErrors({ general: "Failed to send verification code. Please try again." });
                setLoading(false);
                return;
            }

            // Sign out the user (don't auto-login)
            await auth.signOut();

            // Redirect to OTP verification page with uid
            navigate("/verify-otp", {
                replace: true,
                state: {
                    email: formData.email,
                    fullName: formData.fullName,
                    uid: user.uid
                }
            });

        } catch (error) {
            let errorMessage = "Registration failed";
            switch (error.code) {
                case "auth/email-already-in-use":
                    errorMessage = "An account with this email already exists. Please log in instead.";
                    break;
                case "auth/invalid-email":
                    errorMessage = "Invalid email address";
                    break;
                case "auth/weak-password":
                    errorMessage = "Password is too weak";
                    break;
                case "auth/operation-not-allowed":
                    errorMessage = "Email/password accounts are not enabled";
                    break;
                default:
                    errorMessage = error.message || "Registration failed";
            }
            setErrors({ general: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-400 to-purple-500 p-4 overflow-auto">
            <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-8 shadow-2xl my-auto">

                {/* HEADER */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Sign up to get started
                    </p>
                </div>

                {/* ERROR */}
                {errors.general && (
                    <div className="mb-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-600">
                        {errors.general}
                    </div>
                )}

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* FULL NAME */}
                    <div>
                        <label className="text-sm font-medium text-gray-600">
                            Full Name
                        </label>
                        <div className="relative mt-1">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="John Doe"
                                className={`w-full rounded-xl text-gray-600 border pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none ${errors.fullName ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                        </div>
                        {errors.fullName && (
                            <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                        )}
                    </div>

                    {/* EMAIL */}
                    <div>
                        <label className="text-sm font-medium text-gray-600">
                            Email
                        </label>
                        <div className="relative mt-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@example.com"
                                className={`w-full rounded-xl text-gray-600 border pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none ${errors.email ? "border-red-500" : "border-gray-100"
                                    }`}
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                        )}
                    </div>

                    {/* PASSWORD */}
                    <div>
                        <label className="text-sm font-medium text-gray-600">
                            Password
                        </label>
                        <div className="relative mt-1">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create password"
                                className={`w-full rounded-xl text-gray-600 border pl-10 pr-10 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none ${errors.password ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                        )}
                    </div>

                    {/* CONFIRM PASSWORD */}
                    <div>
                        <label className="text-sm font-medium text-gray-600">
                            Confirm Password
                        </label>
                        <div className="relative mt-1">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm password"
                                className={`w-full rounded-xl text-gray-600 border pl-10 pr-10 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none ${errors.confirmPassword ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.confirmPassword}
                            </p>
                        )}
                    </div>

                    {/* BUTTON */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 disabled:opacity-50"
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                {/* DIVIDER */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-4 text-gray-500">OR</span>
                    </div>
                </div>

                {/* GOOGLE SIGN-IN */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 rounded-xl bg-white border-2 border-gray-300 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 disabled:opacity-50 mb-6"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                {/* FOOTER */}
                <p className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <button
                        onClick={() => navigate("/")}
                        className="font-medium text-indigo-600 hover:underline"
                    >
                        Log in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Register;
