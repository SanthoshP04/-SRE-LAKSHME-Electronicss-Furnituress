import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import {
    User,
    Package,
    MapPin,
    Heart,
    Settings,
    LogOut,
    ChevronRight,
    Edit,
    Plus,
    Loader2,
    X,
    Calendar,
    CreditCard,
    Truck,
    Camera
} from "lucide-react";
import Navbar from "../Home/Navbar";
import Footer from "../Home/Footer";
import { getUserOrders, getUserAddresses, updateUserProfile, getUserProfile, getOrderById, addAddress, updateAddress } from "../../firebase/firebaseServices";
import API_URL from "../../config/api";

const Profile = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("orders");
    const [cartCount, setCartCount] = useState(0);
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [addressForm, setAddressForm] = useState({
        fullName: "",
        phone: "",
        address: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        type: "Home",
        isDefault: false
    });
    const [profileData, setProfileData] = useState({
        displayName: "",
        email: "",
        phone: ""
    });

    // Profile photo upload states
    const [photoPreview, setPhotoPreview] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef(null);

    // Get user from localStorage OR Firebase Auth
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Use onAuthStateChanged to wait for Firebase Auth to initialize
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // Get stored user data from localStorage (may have updated photoURL from Cloudinary)
                const storedUser = localStorage.getItem("user");
                const storedUserData = storedUser ? JSON.parse(storedUser) : {};

                // Create updated user object - prioritize localStorage photoURL (Cloudinary) over Firebase Auth
                const updatedUser = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: storedUserData.displayName || currentUser.displayName || "User",
                    photoURL: storedUserData.photoURL || currentUser.photoURL || null,
                    role: storedUserData.role || "user"
                };

                // Debug log
                console.log("Profile - User synced:", updatedUser);
                console.log("PhotoURL (prioritized from localStorage):", updatedUser.photoURL);

                // Update localStorage and state
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
            } else {
                // Fallback to localStorage if no Firebase user
                const storedUser = JSON.parse(localStorage.getItem("user") || "null");
                if (storedUser) {
                    setUser(storedUser);
                } else {
                    // Default fallback
                    setUser({
                        displayName: "User",
                        email: "user@example.com"
                    });
                }
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user?.uid) {
            loadData();
            loadCartCount();
        }
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            if (user?.uid) {
                // Load each data source separately with individual error handling
                let userOrders = [];
                let userAddresses = [];
                let userProfile = null;

                // Try to load orders (may fail due to missing data)
                try {
                    userOrders = await getUserOrders(user.uid);
                    console.log(`✅ Loaded ${userOrders.length} orders for user ${user.uid}`);
                } catch (orderError) {
                    console.error("Error loading orders:", orderError);
                    console.error("Error details:", {
                        message: orderError.message,
                        code: orderError.code,
                        userId: user.uid
                    });
                    // Show helpful message in console
                    if (orderError.message?.includes('index')) {
                        console.warn("⚠️ Firestore Index Required: Create a composite index for 'orders' collection with fields: userId (Ascending) + createdAt (Descending)");
                    }
                }

                // Try to load addresses
                try {
                    userAddresses = await getUserAddresses(user.uid);
                } catch (addressError) {
                    console.error("Error loading addresses:", addressError);
                }

                // Try to load user profile
                try {
                    userProfile = await getUserProfile(user.uid);
                } catch (profileError) {
                    console.error("Error loading profile:", profileError);
                }

                // Set data even if some queries failed
                setOrders(userOrders);
                setAddresses(userAddresses);

                // Load profile data from Firestore if available
                let phoneNumber = "";
                if (userProfile && userProfile.phone) {
                    phoneNumber = userProfile.phone;
                } else if (userAddresses && userAddresses.length > 0) {
                    // If no phone in profile, get from default address or first address
                    const defaultAddr = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
                    phoneNumber = defaultAddr.phone || "";
                }

                setProfileData({
                    displayName: userProfile?.fullName || userProfile?.displayName || user.displayName || "",
                    email: user.email || "",
                    phone: phoneNumber
                });
            }
        } catch (error) {
            console.error("Error loading profile data:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadCartCount = () => {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartCount(cart.length);
    };

    // Handle photo file selection
    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type - accept any image
        if (!file.type.startsWith('image/')) {
            alert("❌ Please select a valid image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("❌ Image size should be less than 5MB");
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Upload photo to Cloudinary via backend API
    const handleUploadPhoto = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file || !user?.uid) return null;

        try {
            setUploadingPhoto(true);

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('image', file);
            formData.append('userId', user.uid);

            // Upload to backend which handles Cloudinary upload
            const response = await fetch(`${API_URL}/api/upload/profile-image`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to upload image');
            }

            console.log("✅ Photo uploaded to Cloudinary:", data.photoURL);
            return data.photoURL;
        } catch (error) {
            console.error("Error uploading photo:", error);
            throw error;
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            if (user?.uid) {
                let photoURL = user.photoURL;

                // Upload new photo if selected
                if (photoPreview && fileInputRef.current?.files?.[0]) {
                    photoURL = await handleUploadPhoto();
                }

                // Save with both fullName and displayName for consistency
                const updateData = {
                    fullName: profileData.displayName,
                    displayName: profileData.displayName,
                    phone: profileData.phone
                };

                // Add photoURL if we have one
                if (photoURL) {
                    updateData.photoURL = photoURL;
                }

                await updateUserProfile(user.uid, updateData);

                // Also update the users collection directly for photoURL
                if (photoURL) {
                    const userDocRef = doc(db, "users", user.uid);
                    await updateDoc(userDocRef, { photoURL: photoURL });
                }

                // Update all addresses with new phone number
                if (profileData.phone && addresses.length > 0) {
                    const updatePromises = addresses.map(addr =>
                        updateAddress(user.uid, addr.id, { phone: profileData.phone })
                    );
                    await Promise.all(updatePromises);
                }

                // Update localStorage
                const updatedUser = {
                    ...user,
                    displayName: profileData.displayName,
                    phone: profileData.phone,
                    photoURL: photoURL || user.photoURL
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);

                // Clear preview
                setPhotoPreview(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }

                // Show success message with proper UI feedback
                alert("✅ Profile updated successfully!");

                // Reload data to reflect changes
                await loadData();
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("❌ Error updating profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddAddress = () => {
        setShowAddressModal(true);
    };

    const handleViewOrderDetails = async (orderId) => {
        try {
            setLoading(true);
            const order = await getOrderById(orderId);
            setSelectedOrder(order);
            setShowOrderModal(true);
        } catch (error) {
            console.error("Error fetching order:", error);
            alert("❌ Error loading order details");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAddress = async () => {
        try {
            // Validation
            if (!addressForm.fullName.trim() || addressForm.fullName.trim().length < 3) {
                alert("❌ Please enter a valid full name (minimum 3 characters)");
                return;
            }
            if (!addressForm.phone.trim() || !/^\d{10}$/.test(addressForm.phone.trim())) {
                alert("❌ Please enter a valid 10-digit phone number");
                return;
            }
            if (!addressForm.address.trim() || addressForm.address.trim().length < 10) {
                alert("❌ Please enter a valid address (minimum 10 characters)");
                return;
            }
            if (!addressForm.city.trim()) {
                alert("❌ Please enter a city");
                return;
            }
            if (!addressForm.state.trim()) {
                alert("❌ Please enter a state");
                return;
            }
            if (!addressForm.pincode.trim() || !/^\d{6}$/.test(addressForm.pincode.trim())) {
                alert("❌ Please enter a valid 6-digit pincode");
                return;
            }

            setSaving(true);
            await addAddress(user.uid, {
                ...addressForm,
                createdAt: new Date().toISOString()
            });

            // Reset form and reload
            setAddressForm({
                fullName: "",
                phone: "",
                address: "",
                addressLine2: "",
                city: "",
                state: "",
                pincode: "",
                type: "Home",
                isDefault: false
            });
            setShowAddressModal(false);
            await loadData();
            alert("✅ Address added successfully!");
        } catch (error) {
            console.error("Error saving address:", error);
            alert("❌ Error saving address. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("cart");
            localStorage.removeItem("wishlist");
            navigate("/", { replace: true });
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "delivered": return "bg-emerald-100 text-emerald-700";
            case "shipped": return "bg-blue-100 text-blue-700";
            case "processing": return "bg-amber-100 text-amber-700";
            case "pending": return "bg-slate-100 text-slate-700";
            case "cancelled": return "bg-red-100 text-red-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "N/A";

        // Handle Firestore Timestamp objects
        let date;
        if (dateValue.toDate && typeof dateValue.toDate === 'function') {
            date = dateValue.toDate();
        } else if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else if (dateValue instanceof Date) {
            date = dateValue;
        } else {
            return "N/A";
        }

        return date.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    const tabs = [
        { id: "orders", label: "My Orders", icon: Package },
        { id: "addresses", label: "Addresses", icon: MapPin },
        { id: "wishlist", label: "Wishlist", icon: Heart },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    // Don't render until user is loaded
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 size={40} className="animate-spin text-gray-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar user={user} cartCount={cartCount} />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    {/* Profile Photo with WhatsApp-style edit icon */}
                                    <div
                                        className="relative cursor-pointer group"
                                        onClick={() => {
                                            setActiveTab("settings");
                                            setTimeout(() => fileInputRef.current?.click(), 100);
                                        }}
                                        title="Change profile photo"
                                    >
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName || "User"}
                                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 group-hover:border-gray-700 transition"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                                            style={{ display: user.photoURL ? 'none' : 'flex' }}
                                        >
                                            {user.email?.[0]?.toUpperCase() || "U"}
                                        </div>

                                        {/* WhatsApp-style camera icon - positioned at bottom right */}
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center border-2 border-white shadow-md group-hover:bg-gray-900 transition">
                                            <Camera size={12} className="text-white" />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-bold text-gray-800 text-lg truncate">{user.displayName || "User"}</h2>
                                        <p className="text-sm text-gray-600 truncate" title={user.email}>{user.email}</p>
                                    </div>
                                </div>

                                <nav className="space-y-1">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => tab.id === "wishlist" ? navigate("/wishlist") : setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === tab.id
                                                ? "bg-gray-800 text-white"
                                                : "text-gray-600 hover:bg-gray-100"
                                                }`}
                                        >
                                            <tab.icon size={18} />
                                            <span className="font-medium">{tab.label}</span>
                                        </button>
                                    ))}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition"
                                    >
                                        <LogOut size={18} />
                                        <span className="font-medium">Logout</span>
                                    </button>
                                </nav>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="lg:col-span-3">
                            {loading ? (
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 flex items-center justify-center">
                                    <Loader2 size={40} className="animate-spin text-gray-600" />
                                </div>
                            ) : (
                                <>
                                    {activeTab === "orders" && (
                                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                            <h3 className="text-lg font-bold text-gray-800 mb-4">My Orders</h3>
                                            {orders.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                                                    <p className="text-gray-500 mb-4">No orders yet</p>
                                                    <button
                                                        onClick={() => navigate("/products")}
                                                        className="px-6 py-2 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 transition"
                                                    >
                                                        Start Shopping
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {orders.map((order) => (
                                                        <div key={order.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div>
                                                                    <p className="font-semibold text-gray-800">Order #{order.id.slice(-8).toUpperCase()}</p>
                                                                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                                                                </div>
                                                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                                                                    {order.status || "Pending"}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                {order.items?.slice(0, 3).map((item, i) => (
                                                                    <span key={i} className="text-2xl">{item.image}</span>
                                                                ))}
                                                                {order.items?.length > 3 && (
                                                                    <span className="text-sm text-gray-500">+{order.items.length - 3} more</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-gray-600">{order.items?.length || 0} item(s)</p>
                                                                <div className="flex items-center gap-4">
                                                                    <p className="font-bold text-gray-800">₹{order.total?.toLocaleString()}</p>
                                                                    <button
                                                                        onClick={() => handleViewOrderDetails(order.id)}
                                                                        className="text-gray-700 font-medium text-sm flex items-center gap-1 hover:text-gray-900"
                                                                    >
                                                                        View Details <ChevronRight size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === "addresses" && (
                                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold text-gray-800">Saved Addresses</h3>
                                                <button
                                                    onClick={handleAddAddress}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 transition"
                                                >
                                                    <Plus size={18} /> Add New
                                                </button>
                                            </div>
                                            {addresses.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                                                    <p className="text-gray-500">No saved addresses</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {addresses.map((addr) => (
                                                        <div key={addr.id} className={`border-2 rounded-xl p-4 ${addr.isDefault ? "border-gray-800" : "border-gray-200"}`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">{addr.type || "Home"}</span>
                                                                {addr.isDefault && <span className="text-xs text-gray-700 font-medium">Default</span>}
                                                            </div>
                                                            <p className="font-semibold text-gray-800">{addr.fullName || addr.name}</p>
                                                            <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                                                            <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                                                            <p className="text-sm text-gray-600 mt-1">{addr.phone}</p>
                                                            <div className="mt-3 flex gap-2">
                                                                <button className="flex items-center gap-1 text-sm text-gray-700 font-medium hover:text-gray-900">
                                                                    <Edit size={14} /> Edit
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === "settings" && (
                                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                            <h3 className="text-lg font-bold text-gray-800 mb-4">Account Settings</h3>

                                            {/* Profile Photo Upload Section */}
                                            <div className="mb-6 pb-6 border-b border-gray-200">
                                                <label className="block text-sm font-medium text-gray-700 mb-3">Profile Photo</label>
                                                <div className="flex items-center gap-4">
                                                    {/* Photo Display/Upload Area */}
                                                    <div
                                                        className="relative cursor-pointer group"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        {/* Display preview, user photo, or placeholder */}
                                                        {(photoPreview || user.photoURL) ? (
                                                            <img
                                                                src={photoPreview || user.photoURL}
                                                                alt={user.displayName || "User"}
                                                                className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 group-hover:border-gray-700 transition"
                                                            />
                                                        ) : (
                                                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white text-3xl font-bold group-hover:from-gray-800 group-hover:to-gray-900 transition">
                                                                {user.email?.[0]?.toUpperCase() || "U"}
                                                            </div>
                                                        )}

                                                        {/* Camera overlay */}
                                                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                            {uploadingPhoto ? (
                                                                <Loader2 size={24} className="text-white animate-spin" />
                                                            ) : (
                                                                <Camera size={24} className="text-white" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Hidden file input */}
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        onChange={handlePhotoChange}
                                                        accept="image/*"
                                                        className="hidden"
                                                    />

                                                    {/* Upload instructions */}
                                                    <div className="flex-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            disabled={uploadingPhoto}
                                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            <Camera size={16} />
                                                            {photoPreview ? "Change Photo" : "Upload Photo"}
                                                        </button>
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            JPEG, PNG, GIF or WebP. Max 5MB.
                                                        </p>
                                                        {photoPreview && (
                                                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                                ✓ New photo selected. Click "Save Changes" to upload.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.displayName}
                                                        onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                    <input
                                                        type="email"
                                                        value={profileData.email}
                                                        disabled
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-gray-50 text-gray-500 cursor-not-allowed"
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        value={profileData.phone}
                                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                        placeholder="+91 98765 43210"
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleSaveProfile}
                                                    disabled={saving || uploadingPhoto}
                                                    className="px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                                >
                                                    {(saving || uploadingPhoto) && <Loader2 size={18} className="animate-spin" />}
                                                    {uploadingPhoto ? "Uploading Photo..." : "Save Changes"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Order Details Modal */}
            {showOrderModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
                                <p className="text-sm text-gray-500">Order #{selectedOrder.id.slice(-8).toUpperCase()}</p>
                            </div>
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Order Status & Date */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Order Date</p>
                                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Calendar size={16} />
                                        {formatDate(selectedOrder.createdAt)}
                                    </p>
                                </div>
                                <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}>
                                    {selectedOrder.status || "Pending"}
                                </span>
                            </div>

                            {/* Items */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3">Items Ordered</h3>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                            <div className="text-4xl">{item.image}</div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800">{item.name}</p>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-semibold text-gray-800">₹{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shipping Address */}
                            {selectedOrder.shippingAddress && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <Truck size={18} />
                                        Shipping Address
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        <p className="font-medium text-gray-800 text-base">{selectedOrder.shippingAddress.fullName}</p>
                                        <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.address}</p>
                                        <p className="text-sm text-gray-600">
                                            {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                                        </p>
                                        <div className="pt-2 border-t border-gray-200 space-y-1">
                                            <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Phone:</span> {selectedOrder.shippingAddress.phone}</p>
                                            {selectedOrder.shippingAddress.email && (
                                                <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Email:</span> {selectedOrder.shippingAddress.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Method */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <CreditCard size={18} />
                                    Payment Method
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-800 font-medium">
                                        {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' :
                                            selectedOrder.paymentMethod === 'upi' ? 'UPI' :
                                                selectedOrder.paymentMethod === 'card' ? 'Credit/Debit Card' :
                                                    selectedOrder.paymentMethod === 'netbanking' ? 'Net Banking' :
                                                        selectedOrder.paymentMethod || "Cash on Delivery"}
                                    </p>
                                </div>
                            </div>

                            {/* Price Summary */}
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="font-semibold text-gray-800 mb-3">Price Summary</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>₹{selectedOrder.subtotal?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span>₹{selectedOrder.shipping?.toLocaleString() || 0}</span>
                                    </div>
                                    {selectedOrder.discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>-₹{selectedOrder.discount?.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold text-gray-800 border-t border-gray-200 pt-2">
                                        <span>Total</span>
                                        <span>₹{selectedOrder.total?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Address Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">Add New Address</h2>
                            <button
                                onClick={() => setShowAddressModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={addressForm.fullName}
                                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                <input
                                    type="tel"
                                    value={addressForm.phone}
                                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                                    placeholder="9876543210"
                                    maxLength={10}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                                <input
                                    type="text"
                                    value={addressForm.address}
                                    onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                                    placeholder="House No, Street Name"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                                <input
                                    type="text"
                                    value={addressForm.addressLine2}
                                    onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                                    placeholder="Landmark, Area"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                    <input
                                        type="text"
                                        value={addressForm.city}
                                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                        placeholder="Mumbai"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                                    <input
                                        type="text"
                                        value={addressForm.state}
                                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                        placeholder="Maharashtra"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                                <input
                                    type="text"
                                    value={addressForm.pincode}
                                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                    placeholder="400001"
                                    maxLength={6}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                                <select
                                    value={addressForm.type}
                                    onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                >
                                    <option value="Home">Home</option>
                                    <option value="Work">Work</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={addressForm.isDefault}
                                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                                    className="w-4 h-4 text-gray-800 focus:ring-gray-500"
                                />
                                <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default address</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowAddressModal(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveAddress}
                                    disabled={saving}
                                    className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {saving && <Loader2 size={18} className="animate-spin" />}
                                    {saving ? "Saving..." : "Save Address"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Profile;