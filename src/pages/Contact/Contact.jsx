import React, { useState, useEffect } from "react";
import {
    Phone,
    Mail,
    MapPin,
    Clock,
    Send,
    MessageSquare,
    HelpCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CheckCircle
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

const Contact = () => {
    const [user, setUser] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const [currentBanner, setCurrentBanner] = useState(0);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
    });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);
    const [siteContent, setSiteContent] = useState({
        heroTitle: "Contact Us",
        heroSubtitle: "We'd love to hear from you. Get in touch with our team.",
        bannerImages: [],
        phone1: "98659 19011",
        phone2: "98427 10005",
        email: "jckumaresan@gmail.com",
        address: "4, Nalwar Veedhi, Vandipettai",
        city: "Chennimalai, Tamil Nadu 638051",
        mapUrl: "https://maps.app.goo.gl/iENbx7p6vSarfLke9",
        businessHours: "Mon-Sat: 9AM-8PM",
        sundayHours: "Sunday: 10AM-6PM",
        faqs: []
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
                const docRef = doc(db, "siteSettings", "contact");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSiteContent(prev => ({ ...prev, ...docSnap.data() }));
                }
            } catch (error) {
                console.error("Error loading contact content:", error);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1000));

        setSubmitted(true);
        setSubmitting(false);
        setFormData({
            name: "",
            email: "",
            phone: "",
            subject: "",
            message: ""
        });

        setTimeout(() => setSubmitted(false), 5000);
    };

    const contactInfo = [
        {
            icon: Phone,
            title: "Phone",
            value: siteContent.phone1,
            subtext: siteContent.phone2,
            link: `tel:${siteContent.phone1}`
        },
        {
            icon: Mail,
            title: "Email",
            value: siteContent.email,
            subtext: "24/7 response",
            link: `mailto:${siteContent.email}`
        },
        {
            icon: MapPin,
            title: "Address",
            value: siteContent.address,
            subtext: siteContent.city,
            link: siteContent.mapUrl
        },
        {
            icon: Clock,
            title: "Business Hours",
            value: siteContent.businessHours,
            subtext: siteContent.sundayHours,
            link: null
        },
    ];

    const faqs = siteContent.faqs.length > 0 ? siteContent.faqs.map(f => ({ q: f.question, a: f.answer })) : [
        { q: "What is your return policy?", a: "We offer a 30-day return policy on all products. Items must be unused and in original packaging for a full refund." },
        { q: "How long does delivery take?", a: "Standard delivery takes 5-7 business days. Express delivery (2-3 days) is available for select areas at an additional cost." },
        { q: "Do you offer installation services?", a: "Yes! We provide free installation for all major appliances and furniture. Installation is scheduled after delivery." },
        { q: "What warranty do you provide?", a: "All products come with a minimum 1-year warranty. Many electrical appliances have extended warranties up to 5 years." },
        { q: "Can I track my order?", a: "Yes, you'll receive a tracking link via email and SMS once your order ships. You can also track from your account dashboard." },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar user={user} cartCount={cartCount} />

            <main className="flex-1">
                {/* BANNER CAROUSEL */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                        {/* Banner Image Container */}
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
                    {/* Contact Info Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        {contactInfo.map((info, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-xl border border-gray-300 p-6 text-center hover:shadow-lg transition-all duration-300 group"
                            >
                                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-800 transition-all duration-300">
                                    <info.icon size={26} className="text-gray-700 group-hover:text-white transition-colors duration-300" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2 text-sm uppercase tracking-wide">
                                    {info.title}
                                </h3>
                                {info.link ? (
                                    <a
                                        href={info.link}
                                        target={info.link.startsWith('http') ? "_blank" : undefined}
                                        rel={info.link.startsWith('http') ? "noopener noreferrer" : undefined}
                                        className="text-gray-800 font-medium hover:text-gray-600 transition-colors block"
                                    >
                                        {info.value}
                                    </a>
                                ) : (
                                    <p className="text-gray-800 font-medium">{info.value}</p>
                                )}
                                <p className="text-sm text-gray-500 mt-1">{info.subtext}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                        {/* Contact Form */}
                        <div className="bg-white rounded-2xl border border-gray-300 p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <MessageSquare size={22} className="text-gray-700" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
                            </div>

                            {submitted ? (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle size={40} className="text-green-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Message Sent!</h3>
                                    <p className="text-gray-600 text-lg mb-2">Thank you for reaching out to us.</p>
                                    <p className="text-gray-500">We'll get back to you within 24 hours.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Your Name *
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                placeholder="+91 98765 43210"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Subject *
                                            </label>
                                            <select
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white cursor-pointer transition"
                                            >
                                                <option value="">Select Subject</option>
                                                <option value="order">Order Inquiry</option>
                                                <option value="product">Product Question</option>
                                                <option value="return">Returns & Refunds</option>
                                                <option value="warranty">Warranty Claim</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Your Message *
                                        </label>
                                        <textarea
                                            placeholder="Tell us how we can help you..."
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            required
                                            rows={5}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none transition"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-3.5 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Map */}
                        <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden shadow-sm">
                            <div className="h-80">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.8!2d77.7!3d11.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDEyJzAwLjAiTiA3N8KwNDInMDAuMCJF!5e0!3m2!1sen!2sin!4v1600000000000!5m2!1sen!2sin"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Store Location"
                                ></iframe>
                            </div>
                            <div className="p-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Visit Our Showroom</h3>
                                <p className="text-gray-700 font-medium mb-2">
                                    {siteContent.address}
                                </p>
                                <p className="text-gray-600 mb-4">
                                    {siteContent.city}
                                </p>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Experience our products in person. Our expert staff will help you find the perfect products for your home.
                                </p>
                                <a
                                    href={siteContent.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
                                >
                                    <MapPin size={18} />
                                    Get Directions
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* FAQs */}
                    <div className="bg-white rounded-2xl border border-gray-300 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <HelpCircle size={22} className="text-gray-700" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
                        </div>
                        <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <div
                                    key={i}
                                    className="border border-gray-300 rounded-xl overflow-hidden hover:border-gray-400 transition"
                                >
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition"
                                    >
                                        <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                                        <ChevronDown
                                            size={20}
                                            className={`text-gray-500 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                                        />
                                    </button>
                                    {openFaq === i && (
                                        <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-gray-200 pt-4">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;