import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import {
    LayoutDashboard,
    Package,
    Users,
    ShoppingCart,
    Settings,
    LogOut,
    Menu,
    X,
    Home,
    Info,
    Phone,
    Mail
} from "lucide-react";

// Import admin page components
import DashboardHome from "./Admin_pages/Dashboard/DashboardHome";
import Products from "./Admin_pages/Products/Products";
import Orders from "./Admin_pages/Order/Orders";
import Customers from "./Admin_pages/Customer/Customers";
import Subscribers from "./Admin_pages/Subscribers/Subscribers";
import EditHomeContent from "./Admin_pages/Home/EditHomeContent";
import EditAboutContent from "./Admin_pages/About/EditAboutContent";
import EditContactContent from "./Admin_pages/Contact/EditContactContent";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
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
                console.log("AdminDashboard - User synced:", updatedUser);
                console.log("PhotoURL (prioritized from localStorage):", updatedUser.photoURL);

                // Update localStorage and state
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
            } else {
                // Fallback to localStorage if no Firebase user
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            }
        });

        // Close sidebar on mobile by default
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
                setMobileMenuOpen(false);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            unsubscribe();
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/", { replace: true });
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleMenuClick = (tabId) => {
        setActiveTab(tabId);
        if (window.innerWidth < 1024) {
            setMobileMenuOpen(false);
        }
    };

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "products", label: "Products", icon: Package },
        { id: "orders", label: "Orders", icon: ShoppingCart },
        { id: "customers", label: "Customers", icon: Users },
        { id: "subscribers", label: "Subscribers", icon: Mail },
        { id: "home-content", label: "Home Page", icon: Home },
        { id: "about-content", label: "About Page", icon: Info },
        { id: "contact-content", label: "Contact Page", icon: Phone },
    ];

    // Render the active page component
    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return <DashboardHome />;
            case "products":
                return <Products />;
            case "orders":
                return <Orders />;
            case "customers":
                return <Customers />;
            case "subscribers":
                return <Subscribers />;
            case "home-content":
                return <EditHomeContent />;
            case "about-content":
                return <EditAboutContent />;
            case "contact-content":
                return <EditContactContent />;
            default:
                return <DashboardHome />;
        }
    };

    return (
        <div className="fixed inset-0 flex bg-slate-100">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Desktop */}
            <aside
                className={`hidden lg:flex ${sidebarOpen ? "w-64" : "w-20"
                    } bg-slate-900 text-white transition-all duration-300 flex-col`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    {sidebarOpen && (
                        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg hover:bg-slate-800 transition"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleMenuClick(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === item.id
                                ? "bg-slate-700 text-white shadow-lg"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <item.icon size={20} />
                            {sidebarOpen && <span className="font-medium">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                {/* User & Logout */}
                <div className="p-4 border-t border-slate-700">
                    {user && (
                        <div className={`mb-3 ${sidebarOpen ? 'px-4' : 'px-2'}`}>
                            {sidebarOpen ? (
                                <div className="flex items-center gap-3">
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName || 'User'}
                                            className="w-10 h-10 rounded-full border-2 border-slate-600"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold border-2 border-slate-600">
                                            {(user.displayName || user.email || 'U')[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-500">Logged in as</p>
                                        <p className="font-medium text-slate-300 truncate">{user.displayName || user.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center">
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName || 'User'}
                                            className="w-10 h-10 rounded-full border-2 border-slate-600"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold border-2 border-slate-600">
                                            {(user.displayName || user.email || 'U')[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Sidebar - Mobile */}
            <aside
                className={`fixed lg:hidden top-0 left-0 h-full w-72 bg-slate-900 text-white z-50 transform transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    } flex flex-col`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 rounded-lg hover:bg-slate-800 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleMenuClick(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === item.id
                                ? "bg-slate-700 text-white shadow-lg"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* User & Logout */}
                <div className="p-4 border-t border-slate-700">
                    {user && (
                        <div className="mb-3 px-4">
                            <div className="flex items-center gap-3">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName || 'User'}
                                        className="w-10 h-10 rounded-full border-2 border-slate-600"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold border-2 border-slate-600">
                                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-500">Logged in as</p>
                                    <p className="font-medium text-slate-300 truncate">{user.displayName || user.email}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition"
                            >
                                <Menu size={24} className="text-slate-600" />
                            </button>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 capitalize">
                                {activeTab}
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate("/home")}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800 transition-colors duration-200"
                                title="Go to Home Page"
                            >
                                <Home size={18} />
                                <span className="hidden md:inline text-sm font-medium">Go to Home</span>
                            </button>
                            <span className="hidden sm:inline text-sm text-slate-500">
                                {new Date().toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
