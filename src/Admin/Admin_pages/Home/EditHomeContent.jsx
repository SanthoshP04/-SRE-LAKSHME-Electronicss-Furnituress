import React, { useEffect, useState } from "react";
import { Save, Loader2, Plus, X, Image as ImageIcon } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

const EditHomeContent = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newBannerUrl, setNewBannerUrl] = useState("");

    const [content, setContent] = useState({
        heroTitle: "",
        heroSubtitle: "",
        heroButtonText: "",
        bannerImages: [],
        featuredTitle: "",
        latestTitle: "",
        mostSellingTitle: "",
        features: [
            { title: "Free Delivery", desc: "On orders ₹5,000+" },
            { title: "Warranty", desc: "Up to 5 years" },
            { title: "Easy Returns", desc: "30-day policy" },
            { title: "24/7 Support", desc: "We're here to help" }
        ]
    });

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        try {
            const ref = doc(db, "siteSettings", "home");
            const snap = await getDoc(ref);

            if (snap.exists()) {
                setContent(prev => ({
                    ...prev,
                    ...snap.data(),
                }));
            }
        } catch (error) {
            console.error("Error loading home content:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(
                doc(db, "siteSettings", "home"),
                {
                    ...content,
                    updatedAt: new Date().toISOString(),
                },
                { merge: true }
            );
            alert("Home content saved successfully");
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save content");
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

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-gray-500" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Edit Home Page</h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save
                </button>
            </div>

            {/* Hero Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Hero Section</h3>

                {[
                    ["Hero Title", "heroTitle"],
                    ["Hero Subtitle", "heroSubtitle"],
                    ["Button Text", "heroButtonText"],
                ].map(([label, key]) => (
                    <div key={key} className="mb-4">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            {label}
                        </label>
                        <input
                            value={content[key]}
                            onChange={(e) =>
                                setContent(prev => ({ ...prev, [key]: e.target.value }))
                            }
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 outline-none"
                        />
                    </div>
                ))}
            </div>

            {/* Banner Images */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Banner Images</h3>

                <div className="flex gap-2 mb-4">
                    <input
                        value={newBannerUrl}
                        onChange={(e) => setNewBannerUrl(e.target.value)}
                        placeholder="Enter image URL"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none"
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

            {/* Section Titles */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Section Titles</h3>

                <div className="grid md:grid-cols-3 gap-4">
                    {[
                        ["Featured Products", "featuredTitle"],
                        ["Latest Products", "latestTitle"],
                        ["Most Selling Products", "mostSellingTitle"],
                    ].map(([label, key]) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                {label}
                            </label>
                            <input
                                value={content[key]}
                                onChange={(e) =>
                                    setContent(prev => ({ ...prev, [key]: e.target.value }))
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Features Section</h3>
                <p className="text-sm text-gray-500 mb-4">Edit the 4 feature cards shown on the home page</p>

                <div className="grid md:grid-cols-2 gap-4">
                    {(content.features || []).map((feature, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Feature {index + 1} Title
                                </label>
                                <input
                                    value={feature.title}
                                    onChange={(e) => {
                                        const newFeatures = [...content.features];
                                        newFeatures[index].title = e.target.value;
                                        setContent(prev => ({ ...prev, features: newFeatures }));
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Description
                                </label>
                                <input
                                    value={feature.desc}
                                    onChange={(e) => {
                                        const newFeatures = [...content.features];
                                        newFeatures[index].desc = e.target.value;
                                        setContent(prev => ({ ...prev, features: newFeatures }));
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EditHomeContent;
