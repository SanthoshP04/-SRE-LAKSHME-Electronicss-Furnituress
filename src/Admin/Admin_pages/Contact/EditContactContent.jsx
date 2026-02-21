import React, { useState, useEffect } from "react";
import { Save, Loader2, Plus, X, Image as ImageIcon, Trash2 } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

const EditContactContent = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newBannerUrl, setNewBannerUrl] = useState("");
    const [content, setContent] = useState({
        heroTitle: "Contact Us",
        heroSubtitle: "We'd love to hear from you",
        bannerImages: [],
        phone1: "98659 19011",
        phone2: "98427 10005",
        email: "jckumaresan@gmail.com",
        address: "4, Nalwar Veedhi, Vandipettai",
        city: "Chennimalai, Tamil Nadu 638051",
        mapUrl: "https://maps.app.goo.gl/iENbx7p6vSarfLke9",
        businessHours: "Mon-Sat: 9AM-8PM",
        sundayHours: "Sunday: 10AM-6PM",
        faqs: [
            { question: "What is your return policy?", answer: "We offer a 30-day return policy on all products." },
            { question: "How long does delivery take?", answer: "Standard delivery takes 5-7 business days." }
        ]
    });

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        try {
            const docRef = doc(db, "siteSettings", "contact");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setContent({ ...content, ...docSnap.data() });
            }
        } catch (error) {
            console.error("Error loading contact content:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "siteSettings", "contact"), {
                ...content,
                updatedAt: new Date().toISOString()
            });
            alert("Contact content saved successfully!");
        } catch (error) {
            console.error("Error saving:", error);
            alert("Error saving content");
        } finally {
            setSaving(false);
        }
    };

    const addBannerImage = () => {
        if (!newBannerUrl.trim()) return;
        setContent(prev => ({
            ...prev,
            bannerImages: [...prev.bannerImages, newBannerUrl.trim()],
        }));
        setNewBannerUrl("");
    };

    const removeBannerImage = (index) => {
        setContent(prev => ({
            ...prev,
            bannerImages: prev.bannerImages.filter((_, i) => i !== index),
        }));
    };

    const addFaq = () => {
        setContent({
            ...content,
            faqs: [...content.faqs, { question: "", answer: "" }]
        });
    };

    const updateFaq = (index, field, value) => {
        const newFaqs = [...content.faqs];
        newFaqs[index][field] = value;
        setContent({ ...content, faqs: newFaqs });
    };

    const removeFaq = (index) => {
        setContent({
            ...content,
            faqs: content.faqs.filter((_, i) => i !== index)
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-amber-500" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Edit Contact Page</h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                </button>
            </div>

            {/* Hero Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Hero Section</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={content.heroTitle}
                            onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
                        <input
                            type="text"
                            value={content.heroSubtitle}
                            onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Banner Images — matches Home page pattern */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Banner Images</h3>

                <div className="flex gap-2 mb-4">
                    <input
                        value={newBannerUrl}
                        onChange={(e) => setNewBannerUrl(e.target.value)}
                        placeholder="Enter image URL"
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg outline-none"
                    />
                    <button
                        onClick={addBannerImage}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg flex items-center gap-1"
                    >
                        <Plus size={16} /> Add
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {content.bannerImages.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-400">
                            <ImageIcon size={32} className="mx-auto mb-2" />
                            No banner images added
                        </div>
                    )}

                    {content.bannerImages.map((url, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                            <img
                                src={url}
                                alt={`Banner ${index}`}
                                className="w-full h-full object-cover"
                                onError={(e) => (e.target.style.display = "none")}
                            />
                            <button
                                onClick={() => removeBannerImage(index)}
                                className="absolute top-1 right-1 bg-black/70 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone 1</label>
                        <input
                            type="text"
                            value={content.phone1}
                            onChange={(e) => setContent({ ...content, phone1: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone 2</label>
                        <input
                            type="text"
                            value={content.phone2}
                            onChange={(e) => setContent({ ...content, phone2: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={content.email}
                            onChange={(e) => setContent({ ...content, email: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Map Link</label>
                        <input
                            type="url"
                            value={content.mapUrl}
                            onChange={(e) => setContent({ ...content, mapUrl: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                        <input
                            type="text"
                            value={content.address}
                            onChange={(e) => setContent({ ...content, address: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City, State, ZIP</label>
                        <input
                            type="text"
                            value={content.city}
                            onChange={(e) => setContent({ ...content, city: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Business Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Weekday Hours</label>
                        <input
                            type="text"
                            value={content.businessHours}
                            onChange={(e) => setContent({ ...content, businessHours: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sunday Hours</label>
                        <input
                            type="text"
                            value={content.sundayHours}
                            onChange={(e) => setContent({ ...content, sundayHours: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-800">FAQs</h3>
                    <button
                        onClick={addFaq}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm"
                    >
                        <Plus size={16} /> Add FAQ
                    </button>
                </div>
                <div className="space-y-4">
                    {content.faqs.map((faq, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-lg relative">
                            <button
                                onClick={() => removeFaq(index)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                            >
                                <X size={16} />
                            </button>
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Question</label>
                                <input
                                    type="text"
                                    value={faq.question}
                                    onChange={(e) => updateFaq(index, "question", e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Answer</label>
                                <textarea
                                    value={faq.answer}
                                    onChange={(e) => updateFaq(index, "answer", e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none resize-none"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EditContactContent;