import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import {
    Heart,
    Menu,
    X,
    LogOut,
    ShoppingCart,
    Search,
    User,
    ChevronDown,
    LayoutDashboard
} from "lucide-react";
import { getProducts } from "../../firebase/firebaseServices";

import logo from "../../assets/logo.jpg";

const Navbar = ({ user, cartCount = 0 }) => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [allProducts, setAllProducts] = useState([]);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const searchRef = useRef(null);
    const profileRef = useRef(null);

    // Check if user is admin
    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const userData = JSON.parse(userStr);
            setIsAdmin(userData?.role === "admin");
        }
    }, [user]);

    // Load products for search
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const products = await getProducts();
                setAllProducts(products);
            } catch (error) {
                console.error("Error loading products:", error);
            }
        };
        loadProducts();
    }, []);

    // Click outside to close search and profile menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.length >= 2) {
            const filtered = allProducts.filter(p =>
                p.name?.toLowerCase().includes(query.toLowerCase()) ||
                p.description?.toLowerCase().includes(query.toLowerCase()) ||
                p.category?.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 6);
            setSearchResults(filtered);
            setShowSearchResults(true);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            setShowSearchResults(false);
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleProductClick = (productId) => {
        setShowSearchResults(false);
        setSearchQuery("");
        navigate(`/product/${productId}`);
    };

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

    const navItems = [
        { label: "Home", href: "/home" },
        { label: "Products", href: "/products" },
        { label: "About Us", href: "/about" },
        { label: "Contact", href: "/contact" },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <div
                className={`fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 lg:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    } shadow-xl flex flex-col`}
            >
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-800">
                    <h2 className="text-lg font-bold text-white text-center w-full leading-snug">
                        SRE LAKSHME<br />
                        ELECTRONICSS &<br />
                        FURNITURESS
                    </h2>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="absolute right-4 p-2 text-white hover:bg-slate-700 rounded-lg transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Mobile Search */}
                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <div className="flex items-center bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                            <div className="flex items-center justify-center w-10 h-10">
                                <Search size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                                placeholder="Search products..."
                                className="flex-1 py-2.5 pr-3 bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                navigate(item.href);
                                setMobileMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition"
                        >
                            {item.label}
                        </button>
                    ))}

                    {/* Admin Dashboard Button - Mobile */}
                    {isAdmin && (
                        <button
                            onClick={() => {
                                navigate('/admin-home');
                                setMobileMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 font-medium transition flex items-center gap-2"
                        >
                            <LayoutDashboard size={20} />
                            Admin Dashboard
                        </button>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </div>

            {/* MAIN HEADER */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                {/* Top Bar */}
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                        {/* LEFT: Menu + Logo + Brand */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition flex-shrink-0"
                            >
                                <Menu size={22} className="text-slate-700" />
                            </button>

                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <img
                                    src={logo}
                                    alt="Logo"
                                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain border-2 border-slate-200 rounded-full p-1.5 sm:p-2 flex-shrink-0"
                                />
                                <div className="min-w-0">
                                    <h1 className="text-sm sm:text-lg font-bold text-slate-800 leading-tight truncate">
                                        SRE LAKSHME
                                    </h1>
                                    <p className="text-xs text-slate-500 font-medium truncate">
                                        Electronicss & Furnituress
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CENTER: Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navItems.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(item.href)}
                                    className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                                >
                                    {item.label}
                                </button>
                            ))}

                            {/* Admin Dashboard Button - Desktop */}
                            {isAdmin && (
                                <button
                                    onClick={() => navigate('/admin-home')}
                                    className="px-4 py-2 font-medium bg-slate-800 text-white hover:bg-slate-700 rounded-lg transition flex items-center gap-2"
                                >
                                    <LayoutDashboard size={18} />
                                    Admin Dashboard
                                </button>
                            )}
                        </nav>

                        {/* RIGHT: Search + Actions */}
                        <div className="flex items-center gap-2">
                            {/* Desktop Search */}
                            <div className="hidden lg:block w-80" ref={searchRef}>
                                <div className="relative">
                                    <div className="flex items-center bg-slate-50 rounded-lg overflow-hidden border border-slate-200 focus-within:border-slate-400 focus-within:bg-white transition">
                                        <div className="flex items-center justify-center w-10 h-10">
                                            <Search size={18} className="text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                                            placeholder="Search products..."
                                            className="flex-1 py-2 pr-2 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                                        />
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchQuery("");
                                                    setSearchResults([]);
                                                    setShowSearchResults(false);
                                                }}
                                                className="p-2 text-slate-400 hover:text-slate-600 transition"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {showSearchResults && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50">
                                            {searchResults.map((product) => (
                                                <div
                                                    key={product.id}
                                                    onClick={() => handleProductClick(product.id)}
                                                    className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition border-b border-slate-100 last:border-0"
                                                >
                                                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                                        <img
                                                            src={product.image || product.imageUrl}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-900 truncate text-sm">
                                                            {product.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">{product.category}</p>
                                                    </div>
                                                    <p className="font-bold text-slate-900 text-sm">
                                                        ₹{product.price?.toLocaleString()}
                                                    </p>
                                                </div>
                                            ))}
                                            <div
                                                onClick={() => handleSearchSubmit()}
                                                className="p-3 bg-slate-50 text-center text-slate-600 hover:bg-slate-100 cursor-pointer font-medium text-sm transition"
                                            >
                                                See all results for "{searchQuery}"
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                <button
                                    onClick={() => navigate("/wishlist")}
                                    className="hidden sm:flex p-2.5 hover:bg-slate-100 rounded-lg transition"
                                    aria-label="Wishlist"
                                >
                                    <Heart size={20} className="text-slate-600" />
                                </button>

                                <button
                                    onClick={() => navigate("/cart")}
                                    className="relative p-2 sm:p-2.5 hover:bg-slate-100 rounded-lg transition"
                                    aria-label="Cart"
                                >
                                    <ShoppingCart size={20} className="text-slate-600" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-5 px-1 sm:px-1.5 bg-slate-800 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-medium">
                                            {cartCount > 99 ? '99+' : cartCount}
                                        </span>
                                    )}
                                </button>

                                {/* User Profile Dropdown */}
                                <div className="relative" ref={profileRef}>
                                    <button
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg transition"
                                        aria-label="User Profile"
                                    >
                                        {user?.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user?.displayName || "User"}
                                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-slate-800"
                                                referrerPolicy="no-referrer"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-800 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                                            style={{ display: user?.photoURL ? 'none' : 'flex' }}
                                        >
                                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <ChevronDown size={16} className="text-slate-600 hidden sm:block" />
                                    </button>

                                    {/* Profile Dropdown Menu */}
                                    {showProfileMenu && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                                            {/* User Info */}
                                            <div className="px-4 py-3 border-b border-slate-100">
                                                <p className="font-semibold text-slate-800 truncate">
                                                    {user?.displayName || 'User'}
                                                </p>
                                                <p className="text-sm text-slate-500 truncate">
                                                    {user?.email}
                                                </p>
                                            </div>

                                            {/* Menu Items */}
                                            <div className="py-1">
                                                <button
                                                    onClick={() => {
                                                        navigate('/profile');
                                                        setShowProfileMenu(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-left"
                                                >
                                                    <User size={18} className="text-slate-600" />
                                                    <span className="text-slate-700">My Profile</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigate('/profile');
                                                        setShowProfileMenu(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-left"
                                                >
                                                    <ShoppingCart size={18} className="text-slate-600" />
                                                    <span className="text-slate-700">My Orders</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigate('/wishlist');
                                                        setShowProfileMenu(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-left"
                                                >
                                                    <Heart size={18} className="text-slate-600" />
                                                    <span className="text-slate-700">Wishlist</span>
                                                </button>
                                            </div>

                                            {/* Logout */}
                                            <div className="border-t border-slate-100 pt-1">
                                                <button
                                                    onClick={() => {
                                                        handleLogout();
                                                        setShowProfileMenu(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 transition text-left"
                                                >
                                                    <LogOut size={18} />
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MOBILE SEARCH BAR - Visible on mobile, hidden on desktop */}
                <div className="lg:hidden px-4 pb-3" ref={searchRef}>
                    <div className="relative">
                        <div className="flex items-center bg-slate-50 rounded-lg overflow-hidden border border-slate-200 focus-within:border-slate-400 focus-within:bg-white transition">
                            <div className="flex items-center justify-center w-10 h-10">
                                <Search size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                                placeholder="Search products..."
                                className="flex-1 py-2.5 pr-2 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 text-sm"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSearchResults([]);
                                        setShowSearchResults(false);
                                    }}
                                    className="p-2 text-slate-400 hover:text-slate-600 transition"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Mobile Search Results Dropdown */}
                        {showSearchResults && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
                                {searchResults.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => handleProductClick(product.id)}
                                        className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition border-b border-slate-100 last:border-0"
                                    >
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={product.image || product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate text-sm">
                                                {product.name}
                                            </p>
                                            <p className="text-xs text-slate-500">{product.category}</p>
                                        </div>
                                        <p className="font-bold text-slate-900 text-sm">
                                            ₹{product.price?.toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                                <div
                                    onClick={() => handleSearchSubmit()}
                                    className="p-3 bg-slate-50 text-center text-slate-600 hover:bg-slate-100 cursor-pointer font-medium text-sm transition"
                                >
                                    See all results for "{searchQuery}"
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
};

export default Navbar;