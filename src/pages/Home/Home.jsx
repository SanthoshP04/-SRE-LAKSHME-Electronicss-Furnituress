import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";



import {
    Home as HomeIcon,
    Sofa,
    Zap,
    Heart,
    User,
    Star,
    ChevronRight,
    ChevronLeft,
    Truck,
    Shield,
    RotateCcw,
    Headphones,
    Filter,
    ShoppingCart,
    Search,
    X
} from "lucide-react";

import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";

import Navbar from "./Navbar";
import Footer from "./Footer";
import FeaturedProducts from "../HomeProductsDisplay/FeaturedProducts";
import LatestProducts from "../HomeProductsDisplay/LatestProducts";
import MostSellingProducts from "../HomeProductsDisplay/MostSellingProducts";
import { getProducts } from "../../firebase/firebaseServices";

// Import banner images
import banner1 from "../../assets/banner1.png";
import banner2 from "../../assets/banner2.png";
import banner3 from "../../assets/banner3.png";
import banner4 from "../../assets/banner4.png";
import shop from "../../assets/shop.png";

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeCategory, setActiveCategory] = useState("all");
    const [cartCount, setCartCount] = useState(0);
    const [currentBanner, setCurrentBanner] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [allProducts, setAllProducts] = useState([]);
    const searchRef = useRef(null);
    const [siteContent, setSiteContent] = useState({
        heroTitle: "Premium Electronics & Furniture",
        heroSubtitle: "Smart products for modern living",
        heroButtonText: "Shop Now",
        bannerImages: [],
        features: [
            { title: "Free Delivery", desc: "On orders ₹5,000+" },
            { title: "Warranty", desc: "Up to 5 years" },
            { title: "Easy Returns", desc: "30-day policy" },
            { title: "24/7 Support", desc: "We're here to help" }
        ]
    });

    const banners = siteContent.bannerImages.length > 0
        ? siteContent.bannerImages
        : [banner1, banner2, banner3, banner4];

    /* 🔐 Firebase Auth Listener + Sync with localStorage */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currentUser) => {
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
                console.log("Home - User synced:", updatedUser);
                console.log("PhotoURL (prioritized from localStorage):", updatedUser.photoURL);

                // Update localStorage and state
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
            } else {
                setUser(null);
            }
        });
        return () => unsub();
    }, []);

    /* 🛒 Firestore Cart Count */
    useEffect(() => {
        if (!user) return;

        const cartRef = collection(db, "users", user.uid, "cart");
        const unsub = onSnapshot(cartRef, (snap) => {
            setCartCount(snap.size);
        });

        return () => unsub();
    }, [user]);

    /* 📄 Load Site Content from Firebase */
    useEffect(() => {
        const loadContent = async () => {
            try {
                const docRef = doc(db, "siteSettings", "home");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSiteContent(prev => ({ ...prev, ...docSnap.data() }));
                }
            } catch (error) {
                console.error("Error loading home content:", error);
            }
        };
        loadContent();
    }, []);

    /* 📦 Load Products for Search */
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

    /* 👆 Click Outside to Close Search */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /* 🔍 Handle Search */
    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.length >= 2) {
            const filtered = allProducts.filter(p =>
                p.name?.toLowerCase().includes(query.toLowerCase()) ||
                p.description?.toLowerCase().includes(query.toLowerCase()) ||
                p.category?.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 6); // Limit to 6 results
            setSearchResults(filtered);
            setShowSearchResults(true);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
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

    /* 🖼️ Banner Auto-Slide */
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [banners.length]);

    const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % banners.length);
    const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);

    const categories = [
        { id: "all", name: "All Products", icon: "🛒" },
        { id: "appliances", name: "Appliances", icon: "🔌" },
        { id: "lighting", name: "Lighting", icon: "💡" },
        { id: "furniture", name: "Furniture", icon: "🛋️" },
    ];



    const defaultIcons = [Truck, Shield, RotateCcw, Headphones];

    const features = (siteContent.features || []).map((f, i) => ({
        icon: defaultIcons[i] || Truck,
        title: f.title,
        desc: f.desc
    }));

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 text-gray-800">
            <Navbar user={user} cartCount={cartCount} />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 py-6">

                    {/* BANNER CAROUSEL */}
                    <div className="relative rounded-2xl overflow-hidden mb-8 group">
                        {/* Banner Image */}
                        <div className="relative w-full h-[200px] sm:h-[320px] lg:h-[420px]">
                            <img
                                src={banners[currentBanner]}
                                alt={`Banner ${currentBanner + 1}`}
                                className="w-full h-full object-cover transition-opacity duration-500"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                        </div>

                        {/* Text Content */}
                        <div className="absolute inset-0 flex items-center">
                            <div className="px-4 sm:px-10 lg:px-16 max-w-2xl">
                                <p className="text-white/90 text-xs sm:text-sm mb-1">
                                    Welcome{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""} 👋
                                </p>

                                <h2 className="text-lg sm:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">
                                    {siteContent.heroTitle}
                                </h2>

                                <p className="text-white/80 text-xs sm:text-base mb-4 hidden sm:block">
                                    {siteContent.heroSubtitle}
                                </p>

                                {/* Buttons */}
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                    <button
                                        onClick={() => navigate("/products?category=electronics")}
                                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                                    >
                                        Shop Electronics
                                    </button>

                                    <button
                                        onClick={() => navigate("/products?category=furniture")}
                                        className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition text-sm"
                                    >
                                        Shop Furniture
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Arrows (hidden on mobile) */}
                        <button
                            onClick={prevBanner}
                            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full items-center justify-center transition"
                        >
                            <ChevronLeft size={22} />
                        </button>

                        <button
                            onClick={nextBanner}
                            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full items-center justify-center transition"
                        >
                            <ChevronRight size={22} />
                        </button>

                        {/* Dots */}
                        <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                            {banners.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentBanner(index)}
                                    className={`h-2.5 rounded-full transition-all ${currentBanner === index
                                        ? "bg-white w-6"
                                        : "bg-white/50 w-2.5"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* FEATURES */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3"
                            >
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <f.icon className="text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-semibold">{f.title}</p>
                                    <p className="text-sm text-gray-500">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* FEATURED PRODUCTS */}
                    <FeaturedProducts />

                    <section className="bg-gray-100 py-10">
                        <div className="max-w-7xl mx-auto px-4">
                            <div className="flex flex-col md:flex-row items-center gap-8 bg-gray-200 rounded-2xl p-6 md:p-10">

                                {/* LEFT - IMAGE */}
                                <div className="w-full md:w-1/2">
                                    <img
                                        src={shop}
                                        alt="Electronics and Furniture Shop"
                                        className="w-full h-auto rounded-xl object-cover"
                                    />
                                </div>

                                {/* RIGHT - TEXT */}
                                <div className="w-full md:w-1/2 text-gray-800">
                                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                                        Electronics & Furniture Store
                                    </h2>

                                    <p className="text-gray-600 mb-4 leading-relaxed">
                                        We provide high-quality electronics and modern furniture designed
                                        to make your home smarter, more comfortable, and stylish.
                                    </p>

                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        From smart appliances to premium sofas, our store offers trusted
                                        products at affordable prices with excellent customer support.
                                    </p>
                                    <button
                                        onClick={() => navigate("/products")}
                                        className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
                                    >
                                        Explore Products
                                    </button>
                                </div>

                            </div>
                        </div>
                    </section>

                    {/* LATEST PRODUCTS */}
                    <LatestProducts />

                    {/* MOST SELLING PRODUCTS */}
                    <MostSellingProducts />
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Home;
