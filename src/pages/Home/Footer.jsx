import React from "react";
import {
    Zap,
    Sofa,
    Phone,
    Mail,
    MapPin,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    CreditCard,
    Shield,
    Truck,
    ChevronRight,
} from "lucide-react";

const Footer = () => {
    const quickLinks = [
        "About Us",
        "Contact Us",
        "FAQs",
        "Track Order",
        "Returns & Refunds",
        "Warranty Policy",
    ];

    const electricalCategories = [
        "Home Appliances",
        "Kitchen Appliances",
        "Lighting Solutions",
        "Fans & Coolers",
        "Wiring & Cables",
        "Smart Home Devices",
    ];

    const furnitureCategories = [
        "Living Room",
        "Bedroom",
        "Dining Room",
        "Office Furniture",
        "Outdoor Furniture",
        "Storage Solutions",
    ];

    const socialLinks = [
        { icon: Facebook, label: "Facebook" },
        { icon: Twitter, label: "Twitter" },
        { icon: Instagram, label: "Instagram" },
        { icon: Youtube, label: "YouTube" },
    ];

    return (
        <footer className="bg-gray-900 text-gray-300">

            {/* Newsletter */}
            <div className="bg-gray-800 py-8 px-4">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-100 mb-1">
                            Subscribe to our newsletter
                        </h3>
                        <p className="text-gray-400">
                            Latest updates, offers & product launches
                        </p>
                    </div>

                    <div className="flex w-full lg:w-auto gap-3">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 lg:w-80 px-4 py-3 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 focus:outline-none focus:border-gray-500"
                        />
                        <button className="px-6 py-3 bg-gray-900 text-gray-100 rounded-lg font-semibold hover:bg-gray-700 transition flex items-center gap-1">
                            Subscribe <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 bg-gray-700 rounded-lg flex items-center justify-center">
                                <Zap size={22} className="text-gray-100" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-100">
                                Electro<span className="text-gray-400">Furn</span>
                            </h2>
                        </div>

                        <p className="text-gray-400 max-w-sm mb-6">
                            Premium electrical appliances and modern furniture for smart homes.
                        </p>

                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3">
                                <MapPin size={16} /> 123 Electronics Street, India
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={16} /> +91 98765 43210
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail size={16} /> support@electrofurn.com
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            {socialLinks.map((s, i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition cursor-pointer"
                                >
                                    <s.icon size={18} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    {[quickLinks, electricalCategories, furnitureCategories].map(
                        (list, i) => (
                            <div key={i}>
                                <h4 className="text-lg font-semibold text-gray-100 mb-4">
                                    {i === 0 ? "Quick Links" : i === 1 ? "Electricals" : "Furniture"}
                                </h4>
                                <ul className="space-y-3 text-sm">
                                    {list.map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-2 hover:text-gray-100 transition cursor-pointer">
                                            <ChevronRight size={14} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    )}
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-8 border-t border-gray-800">
                    {[
                        { icon: Truck, title: "Free Delivery", desc: "Orders above ₹5,000" },
                        { icon: Shield, title: "Warranty", desc: "Up to 5 years" },
                        { icon: CreditCard, title: "Secure Payment", desc: "100% protected" },
                        { icon: Phone, title: "24/7 Support", desc: "Always available" },
                    ].map((f, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                                <f.icon size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-100">{f.title}</p>
                                <p className="text-sm text-gray-400">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom */}
            <div className="border-t border-gray-800 py-6 text-center text-sm text-gray-400">
                © 2024 ElectroFurn. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
