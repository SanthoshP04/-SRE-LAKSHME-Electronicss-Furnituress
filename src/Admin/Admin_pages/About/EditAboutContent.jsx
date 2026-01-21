import React, { useState, useEffect, useRef } from "react";
import { Save, Loader2, Plus, X, Trash2, Image, Upload, Link } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../firebase/firebaseConfig";

const EditAboutContent = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState(null);
    const fileInputRef = useRef(null);
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

    const addBannerImage = () => {
        setContent({
            ...content,
            bannerImages: [...(content.bannerImages || []), ""]
        });
    };

    const updateBannerImage = (index, value) => {
        const newImages = [...(content.bannerImages || [])];
        newImages[index] = value;
        setContent({ ...content, bannerImages: newImages });
    };

    const removeBannerImage = (index) => {
        setContent({
            ...content,
            bannerImages: (content.bannerImages || []).filter((_, i) => i !== index)
        });
    };

    const handleFileUpload = async (event, index) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setUploadingIndex(index);
        try {
            const fileName = `banners/about/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, fileName);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            updateBannerImage(index, downloadURL);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Please try again.');
        } finally {
            setUploadingIndex(null);
        }
    };

    const triggerFileInput = (index) => {
        fileInputRef.current.dataset.index = index;
        fileInputRef.current.click();
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

            {/* Banner Images */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Image size={20} className="text-slate-600" />
                        <h3 className="font-semibold text-slate-800">Banner Images</h3>
                    </div>
                    <button
                        onClick={addBannerImage}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm"
                    >
                        <Plus size={16} /> Add Image
                    </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">Add banner images via URL or upload from your device</p>

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                        const index = parseInt(e.target.dataset.index);
                        handleFileUpload(e, index);
                    }}
                />

                <div className="space-y-4">
                    {(content.bannerImages || []).map((url, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-20 h-14 bg-slate-200 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    {url ? (
                                        <img src={url} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <Image size={24} className="text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-700">Banner {index + 1}</p>
                                    <p className="text-xs text-slate-500 truncate max-w-xs">{url || 'No image selected'}</p>
                                </div>
                                <button
                                    onClick={() => removeBannerImage(index)}
                                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => triggerFileInput(index)}
                                    disabled={uploadingIndex === index}
                                    className="flex items-center gap-2 px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium disabled:opacity-50"
                                >
                                    {uploadingIndex === index ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Upload size={16} />
                                    )}
                                    Upload File
                                </button>
                                <div className="flex-1 flex items-center gap-2">
                                    <Link size={16} className="text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Or paste image URL"
                                        value={url}
                                        onChange={(e) => updateBannerImage(index, e.target.value)}
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!content.bannerImages || content.bannerImages.length === 0) && (
                        <p className="text-slate-400 text-center py-4">No banner images added. Default images will be used.</p>
                    )}
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
