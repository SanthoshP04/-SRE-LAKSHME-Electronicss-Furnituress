import React, { useState, useEffect } from "react";
import { Save, Loader2, Plus, X, Trash2, Image as ImageIcon } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

const EditAboutContent = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newBannerUrl, setNewBannerUrl] = useState("");
    const [content, setContent] = useState({
        heroTitle: "About ElectroFurn",
        heroSubtitle: "Your trusted partner for quality electronics and furniture",
        bannerImages: [],
        mission: "To provide high-quality products at affordable prices",
        vision: "To be the leading e-commerce platform for home essentials",
        story: "Founded in 2020, we started with a simple goal...",
        stats: [
            { label: "Happy Customers", value: "10,000+" },
            { label: "Products", value: "500+" },
            { label: "Cities Served", value: "50+" },
            { label: "Years Experience", value: "5+" }
        ],
        team: []
    });

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        try {
            const docRef = doc(db, "siteSettings", "about");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setContent({ ...content, ...docSnap.data() });
            }
        } catch (error) {
            console.error("Error loading about content:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "siteSettings", "about"), {
                ...content,
                updatedAt: new Date().toISOString()
            });
            alert("About content saved successfully!");
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

    const updateStat = (index, field, value) => {
        const newStats = [...content.stats];
        newStats[index][field] = value;
        setContent({ ...content, stats: newStats });
    };

    const addStat = () => {
        setContent({
            ...content,
            stats: [...content.stats, { label: "New Stat", value: "0" }]
        });
    };

    const removeStat = (index) => {
        setContent({
            ...content,
            stats: content.stats.filter((_, i) => i !== index)
        });
    };

    const addTeamMember = () => {
        setContent({
            ...content,
            team: [...content.team, { name: "", role: "", image: "" }]
        });
    };

    const updateTeamMember = (index, field, value) => {
        const newTeam = [...content.team];
        newTeam[index][field] = value;
        setContent({ ...content, team: newTeam });
    };

    const removeTeamMember = (index) => {
        setContent({
            ...content,
            team: content.team.filter((_, i) => i !== index)
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
                <h2 className="text-xl font-bold text-slate-800">Edit About Page</h2>
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
                <div className="space-y-4">
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

            {/* Mission & Vision */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Mission & Vision</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mission</label>
                        <textarea
                            value={content.mission}
                            onChange={(e) => setContent({ ...content, mission: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Vision</label>
                        <textarea
                            value={content.vision}
                            onChange={(e) => setContent({ ...content, vision: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Our Story */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Our Story</h3>
                <textarea
                    value={content.story}
                    onChange={(e) => setContent({ ...content, story: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-800">Statistics</h3>
                    <button
                        onClick={addStat}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm"
                    >
                        <Plus size={16} /> Add Stat
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {content.stats.map((stat, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-lg relative">
                            <button
                                onClick={() => removeStat(index)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                            >
                                <X size={16} />
                            </button>
                            <input
                                type="text"
                                value={stat.value}
                                onChange={(e) => updateStat(index, "value", e.target.value)}
                                className="w-full text-xl font-bold text-slate-800 bg-transparent border-none outline-none"
                            />
                            <input
                                type="text"
                                value={stat.label}
                                onChange={(e) => updateStat(index, "label", e.target.value)}
                                className="w-full text-sm text-slate-600 bg-transparent border-none outline-none"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Team Members */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-800">Team Members</h3>
                    <button
                        onClick={addTeamMember}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm"
                    >
                        <Plus size={16} /> Add Member
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {content.team.map((member, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-lg">
                            <div className="flex justify-end mb-2">
                                <button
                                    onClick={() => removeTeamMember(index)}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Name"
                                value={member.name}
                                onChange={(e) => updateTeamMember(index, "name", e.target.value)}
                                className="w-full px-3 py-2 mb-2 border border-slate-200 rounded-lg outline-none"
                            />
                            <input
                                type="text"
                                placeholder="Role"
                                value={member.role}
                                onChange={(e) => updateTeamMember(index, "role", e.target.value)}
                                className="w-full px-3 py-2 mb-2 border border-slate-200 rounded-lg outline-none"
                            />
                            <input
                                type="text"
                                placeholder="Image URL"
                                value={member.image}
                                onChange={(e) => updateTeamMember(index, "image", e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EditAboutContent;