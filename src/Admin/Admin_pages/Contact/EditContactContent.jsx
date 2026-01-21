import React, { useState, useEffect, useRef } from "react";
import { Save, Loader2, Plus, X, Image, Trash2, Upload, Link } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../firebase/firebaseConfig";

const EditContactContent = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState(null);
    const fileInputRef = useRef(null);
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

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setUploadingIndex(index);
        try {
            const fileName = `banners/contact/${Date.now()}_${file.name}`;
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
