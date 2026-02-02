import React, { useState, useEffect } from "react";
import {
    Zap,
    Sofa,
    Users,
    Award,
    Target,
    Heart,
    Truck,
    Shield,
    Leaf,
    CreditCard,
    RotateCcw,
    Headphones,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";

import Navbar from "../Home/Navbar";
import Footer from "../Home/Footer";

// Default banner images
import banner1 from "../../assets/banner1.png";
import banner2 from "../../assets/banner2.png";
import banner3 from "../../assets/banner3.png";

const About = () => {
    const [user, setUser] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const [currentBanner, setCurrentBanner] = useState(0);
    const [siteContent, setSiteContent] = useState({
        heroTitle: "About ElectroFurn",
        heroSubtitle: "Your trusted destination for premium electronics and modern furniture",
        bannerImages: [],
        mission: "To provide high-quality products at affordable prices",
        vision: "To be the leading e-commerce platform for home essentials",
        story: "",
        stats: [
            { label: "Happy Customers", value: "10,000+" },
            { label: "Products", value: "500+" },
            { label: "Cities Served", value: "50+" },
            { label: "Years Experience", value: "5+" }
        ],
        team: []
    });

    // Default banners if none in Firestore
    const banners = siteContent.bannerImages && siteContent.bannerImages.length > 0
        ? siteContent.bannerImages
        : [banner1, banner2, banner3];

    // Auth listener
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // Get stored user data from localStorage (may have updated photoURL from Cloudinary)
                const storedUser = localStorage.getItem("user");
                const storedUserData = storedUser ? JSON.parse(storedUser) : {};

                // Create user object - prioritize localStorage photoURL (Cloudinary) over Firebase Auth
                const updatedUser = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: storedUserData.displayName || currentUser.displayName || "User",
                    photoURL: storedUserData.photoURL || currentUser.photoURL || null,
                    role: storedUserData.role || "user"
                };
                setUser(updatedUser);
            } else {
                setUser(null);
            }
        });
        return () => unsub();
    }, []);

    // Cart count listener
    useEffect(() => {
        if (!user) {
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            setCartCount(totalCount);
            return;
        }

        const cartRef = collection(db, "users", user.uid, "cart");
        const unsub = onSnapshot(cartRef, (snap) => {
            const total = snap.docs.reduce((sum, doc) => sum + (doc.data().quantity || 1), 0);
            setCartCount(total);
        });

        return () => unsub();
    }, [user]);

    // Load content from Firebase
    useEffect(() => {
        const loadContent = async () => {
            try {
                const docRef = doc(db, "siteSettings", "about");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSiteContent(prev => ({ ...prev, ...docSnap.data() }));
                }
            } catch (error) {
                console.error("Error loading about content:", error);
            }
        };
        loadContent();
    }, []);

    // Banner auto-slide
    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length]);

    const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % banners.length);
    const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);

    const stats = siteContent.stats.length > 0 ? siteContent.stats : [
        { value: "10,000+", label: "Happy Customers" },
        { value: "500+", label: "Products" },
        { value: "50+", label: "Cities Served" },
        { value: "5+", label: "Years Experience" },
    ];

    const values = [
        { icon: Award, title: "Quality First", desc: "Only premium, tested and certified products." },
        { icon: Target, title: "Customer Focus", desc: "Your satisfaction drives everything we do." },
        { icon: Heart, title: "Passion", desc: "We care deeply about your home and comfort." },
        { icon: Truck, title: "Reliability", desc: "Fast, safe and dependable delivery services." },
    ];

    const extraFeatures = [
        { icon: Leaf, title: "Eco Friendly", desc: "Energy-efficient and sustainable products." },
        { icon: CreditCard, title: "Secure Payments", desc: "100% safe and encrypted transactions." },
        { icon: RotateCcw, title: "Easy Returns", desc: "Hassle-free 30-day return policy." },
        { icon: Headphones, title: "24/7 Support", desc: "Always here to help you anytime." },
    ];

    const team = siteContent.team.length > 0 ? siteContent.team : [
        { name: "Rajesh Kumar", role: "Founder & CEO", image: "👨‍💼" },
        { name: "Priya Sharma", role: "Head of Operations", image: "👩‍💼" },
        { name: "Amit Patel", role: "CTO", image: "👨‍💻" },
        { name: "Sneha Reddy", role: "Customer Success Lead", image: "👩‍🔧" },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
            <Navbar user={user} cartCount={cartCount} />

            <main className="flex-1">
                {/* BANNER CAROUSEL */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                        {/* Banner Image Container with Crossfade */}
                        <div className="relative w-full h-[280px] sm:h-[380px] lg:h-[480px] bg-gray-900">
                            {banners.map((banner, index) => (
                                <div
                                    key={index}
                                    className={`absolute inset-0 transition-opacity duration-700 ${currentBanner === index ? 'opacity-100' : 'opacity-0'
                                        }`}
                                >
                                    <img
                                        src={banner}
                                        alt={`Banner ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                        </div>

                        {/* Text Content */}
                        <div className="absolute inset-0 flex items-center">
                            <div className="px-8 sm:px-12 lg:px-16 max-w-2xl">
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                                    {siteContent.heroTitle}
                                </h1>
                                <p className="text-white/90 text-base sm:text-lg lg:text-xl leading-relaxed">
                                    {siteContent.heroSubtitle}
                                </p>
                            </div>
                        </div>

                        {/* Navigation Arrows - Only show if multiple banners */}
                        {banners.length > 1 && (
                            <>
                                <button
                                    onClick={prevBanner}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100 z-10"
                                    aria-label="Previous banner"
                                >
                                    <ChevronLeft size={24} />
                                </button>

                                <button
                                    onClick={nextBanner}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100 z-10"
                                    aria-label="Next banner"
                                >
                                    <ChevronRight size={24} />
                                </button>

                                {/* Dots Indicator */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
                                    {banners.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentBanner(index)}
                                            className={`h-2.5 rounded-full transition-all ${currentBanner === index
                                                ? "bg-white w-8"
                                                : "bg-white/50 w-2.5 hover:bg-white/70"
                                                }`}
                                            aria-label={`Go to banner ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* STATS */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                        {stats.map((stat, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl border border-gray-300 p-8 text-center hover:shadow-lg transition-all duration-300 group"
                            >
                                <p className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition">
                                    {stat.value || stat.number}
                                </p>
                                <p className="text-gray-600 font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* OUR STORY */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
                        <div>
                            <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Story</h2>
                            <p className="text-gray-600 mb-4 leading-relaxed text-lg">
                                {siteContent.story || "Founded in 2019, ElectroFurn began with a vision to make high-quality electronics and furniture accessible to everyone."}
                            </p>
                            <p className="text-gray-600 mb-4 leading-relaxed">
                                We carefully select products that combine durability, functionality, and modern design to enhance your living spaces.
                            </p>
                            <p className="text-gray-600 leading-relaxed">
                                Today, we proudly serve customers across India with a promise of reliability, trust, and exceptional service.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-gray-800 rounded-2xl p-8 text-white text-center hover:bg-gray-700 transition group">
                                <Zap size={48} className="mx-auto mb-4 group-hover:scale-110 transition" />
                                <p className="font-bold text-lg mb-1">Electronics</p>
                                <p className="text-sm text-gray-300">Smart Appliances</p>
                            </div>
                            <div className="bg-gray-700 rounded-2xl p-8 text-white text-center hover:bg-gray-600 transition group">
                                <Sofa size={48} className="mx-auto mb-4 group-hover:scale-110 transition" />
                                <p className="font-bold text-lg mb-1">Furniture</p>
                                <p className="text-sm text-gray-300">Modern Comfort</p>
                            </div>
                        </div>
                    </div>

                    {/* VALUES */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">Our Core Values</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {values.map((value, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl border border-gray-300 p-6 text-center hover:shadow-lg transition-all duration-300 group"
                                >
                                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-800 transition">
                                        <value.icon size={28} className="text-gray-700 group-hover:text-white transition" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 text-gray-900">{value.title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{value.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* EXTRA FEATURES */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">What Makes Us Different</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {extraFeatures.map((f, i) => (
                                <div
                                    key={i}
                                    className="bg-gray-100 rounded-2xl p-6 text-center hover:bg-gray-200 transition-all duration-300 group"
                                >
                                    <f.icon size={32} className="mx-auto mb-4 text-gray-700 group-hover:scale-110 transition" />
                                    <h3 className="font-bold text-lg mb-2 text-gray-900">{f.title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TEAM */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">Meet Our Team</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {team.map((member, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl border border-gray-300 p-6 text-center hover:shadow-lg transition-all duration-300 group"
                                >
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl group-hover:bg-gray-800 transition">
                                        {member.image}
                                    </div>
                                    <h3 className="font-bold text-lg mb-1 text-gray-900">{member.name}</h3>
                                    <p className="text-sm text-gray-600">{member.role}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* WHY CHOOSE US */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-10 md:p-14 text-white shadow-xl">
                        <h2 className="text-3xl font-bold text-center mb-10">Why Choose ElectroFurn?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div className="group">
                                <Shield size={48} className="mx-auto mb-4 text-gray-300 group-hover:scale-110 transition" />
                                <h3 className="font-bold text-xl mb-2">Extended Warranty</h3>
                                <p className="text-gray-400">Up to 5 years coverage on select products</p>
                            </div>
                            <div className="group">
                                <Truck size={48} className="mx-auto mb-4 text-gray-300 group-hover:scale-110 transition" />
                                <h3 className="font-bold text-xl mb-2">Free Delivery</h3>
                                <p className="text-gray-400">On orders above ₹5,000 across India</p>
                            </div>
                            <div className="group">
                                <Users size={48} className="mx-auto mb-4 text-gray-300 group-hover:scale-110 transition" />
                                <h3 className="font-bold text-xl mb-2">Expert Support</h3>
                                <p className="text-gray-400">Professional assistance anytime you need</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default About;