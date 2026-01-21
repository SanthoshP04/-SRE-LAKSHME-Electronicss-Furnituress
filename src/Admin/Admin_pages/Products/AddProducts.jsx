import React, { useState } from "react";
import { ArrowLeft, Save, Loader2, Upload, Link, Image as ImageIcon, X } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase/firebaseConfig";
import { addProduct } from "../../../firebase/firebaseServices";

const AddProducts = ({ onBack, onSuccess }) => {
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        category: "Electricals",
        price: "",
        originalPrice: "",
        stock: "",
        description: "",
        image: "",
        isFeatured: false,
        inStock: true
    });

    const [mainImage, setMainImage] = useState("");
    const [thumbnailImages, setThumbnailImages] = useState([]);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState("");
    const [addingToMain, setAddingToMain] = useState(true);

    const uploadToStorage = async (file) => {
        const timestamp = Date.now();
        const fileName = `products/${timestamp}_${file.name}`;
        const storageRef = ref(storage, fileName);

        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        return downloadUrl;
    };

    const handleFileUpload = async (e, isMain = true) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            for (const file of files) {
                const url = await uploadToStorage(file);
                if (isMain) {
                    setMainImage(url);
                } else {
                    setThumbnailImages(prev => [...prev, url]);
                }
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Error uploading image. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleAddUrl = () => {
        if (!urlInput.trim()) return;
        if (addingToMain) {
            setMainImage(urlInput.trim());
        } else {
            setThumbnailImages(prev => [...prev, urlInput.trim()]);
        }
        setUrlInput("");
        setShowUrlInput(false);
    };

    const removeThumbnail = (index) => {
        setThumbnailImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const productData = {
                ...formData,
                price: Number(formData.price),
                originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
                stock: Number(formData.stock) || 0,
                imageUrl: mainImage,
                thumbnails: thumbnailImages,
                images: [mainImage, ...thumbnailImages].filter(Boolean)
            };

            await addProduct(productData);
            if (onSuccess) onSuccess();
            if (onBack) onBack();
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Error adding product. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm border border-slate-200"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800">Add New Product</h3>
                        <p className="text-sm text-slate-500">Fill in the product details below</p>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-slate-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Product Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Product Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                placeholder="Enter product name"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-white transition-all"
                            >
                                <option value="Electricals">Electricals</option>
                                <option value="Furniture">Furniture</option>
                                <option value="Appliances">Appliances</option>
                                <option value="Lighting">Lighting</option>
                            </select>
                        </div>

                        {/* Price Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Price (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Original Price (₹)
                                </label>
                                <input
                                    type="number"
                                    value={formData.originalPrice}
                                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Stock & Emoji */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Stock Quantity</label>
                                <input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                    min="0"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Emoji Icon <span className="text-xs text-slate-500">(fallback)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                    placeholder="📦"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="4"
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none resize-none transition-all"
                                placeholder="Enter product description"
                            />
                        </div>

                        {/* IMAGES SECTION */}
                        <div className="border-t border-slate-200 pt-6">
                            <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <ImageIcon size={20} className="text-slate-600" />
                                Product Images
                            </h4>

                            {/* Main Image */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 mb-3">Main Image</label>
                                <div className="flex flex-col sm:flex-row gap-4 items-start">
                                    {mainImage ? (
                                        <div className="relative w-40 h-40 bg-slate-100 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md">
                                            <img src={mainImage} alt="Main" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setMainImage("")}
                                                className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                            <span className="absolute bottom-2 left-2 text-xs bg-emerald-500 text-white px-2 py-1 rounded-md font-medium">
                                                Main
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="w-40 h-40 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                                            <ImageIcon size={32} />
                                            <span className="text-xs mt-2">No image</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer transition-colors font-medium text-sm shadow-sm">
                                            <Upload size={16} />
                                            Upload File
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e, true)}
                                                className="hidden"
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => { setShowUrlInput(true); setAddingToMain(true); }}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium text-sm"
                                        >
                                            <Link size={16} />
                                            Add URL
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Thumbnail Images */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 mb-3">
                                    Additional Images <span className="text-xs text-slate-500">({thumbnailImages.length}/5)</span>
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {thumbnailImages.map((url, index) => (
                                        <div key={index} className="relative w-24 h-24 bg-slate-100 rounded-lg overflow-hidden shadow-md border border-slate-200">
                                            <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeThumbnail(index)}
                                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {thumbnailImages.length < 5 && (
                                        <>
                                            <label className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-slate-500 hover:bg-slate-50 transition-all">
                                                <Upload size={20} />
                                                <span className="text-xs mt-1 font-medium">Upload</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={(e) => handleFileUpload(e, false)}
                                                    className="hidden"
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => { setShowUrlInput(true); setAddingToMain(false); }}
                                                className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-slate-500 hover:bg-slate-50 transition-all"
                                            >
                                                <Link size={20} />
                                                <span className="text-xs mt-1 font-medium">URL</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* URL Input */}
                            {showUrlInput && (
                                <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        {addingToMain ? "Main Image URL" : "Additional Image URL"}
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="url"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddUrl}
                                            className="px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors"
                                        >
                                            Add
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowUrlInput(false); setUrlInput(""); }}
                                            className="px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-100 font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {uploading && (
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <Loader2 size={16} className="animate-spin text-blue-600" />
                                    <span className="font-medium">Uploading image...</span>
                                </div>
                            )}
                        </div>

                        {/* Toggles */}
                        <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 rounded-xl">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={formData.isFeatured}
                                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 cursor-pointer"
                                />
                                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Featured Product</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={formData.inStock}
                                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 cursor-pointer"
                                />
                                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">In Stock</span>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={onBack}
                                className="w-full sm:w-auto px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || uploading}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Add Product
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddProducts;