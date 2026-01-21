import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2, X, Upload, Link, Image as ImageIcon } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase/firebaseConfig";
import { updateProduct, getProductById } from "../../../firebase/firebaseServices";

const EditProducts = ({ productId, onBack, onSuccess }) => {
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
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

    // Image management
    const [mainImage, setMainImage] = useState("");
    const [thumbnailImages, setThumbnailImages] = useState([]);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState("");
    const [addingToMain, setAddingToMain] = useState(true);

    // Fetch product data
    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) {
                setLoading(false);
                return;
            }

            try {
                const product = await getProductById(productId);
                if (product) {
                    setFormData({
                        name: product.name || "",
                        category: product.category || "Electricals",
                        price: product.price || "",
                        originalPrice: product.originalPrice || "",
                        stock: product.stock || "",
                        description: product.description || "",
                        image: product.image || "",
                        isFeatured: product.isFeatured || false,
                        inStock: product.inStock !== false
                    });
                    setMainImage(product.imageUrl || "");
                    setThumbnailImages(product.thumbnails || []);
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    // Upload file to Firebase Storage
    const uploadToStorage = async (file) => {
        const timestamp = Date.now();
        const fileName = `products/${timestamp}_${file.name}`;
        const storageRef = ref(storage, fileName);

        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        return downloadUrl;
    };

    // Handle local file upload
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

    // Add URL image
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

    // Remove thumbnail
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

            await updateProduct(productId, productData);

            if (onSuccess) onSuccess();
            if (onBack) onBack();
        } catch (error) {
            console.error("Error updating product:", error);
            alert("Error updating product. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-slate-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition">
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Edit Product</h3>
                    <p className="text-sm text-slate-500">Update product details</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Product Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
                            placeholder="Enter product name"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            required
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                        >
                            <option value="Electricals">Electricals</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Appliances">Appliances</option>
                            <option value="Lighting">Lighting</option>
                        </select>
                    </div>

                    {/* Price Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Price (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                                min="0"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Original Price (₹)
                            </label>
                            <input
                                type="number"
                                value={formData.originalPrice}
                                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                min="0"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Stock & Emoji */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
                            <input
                                type="number"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                min="0"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Emoji Icon (fallback)</label>
                            <input
                                type="text"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
                                placeholder="📦"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows="3"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none resize-none"
                            placeholder="Enter product description"
                        />
                    </div>

                    {/* IMAGES SECTION */}
                    <div className="border-t border-slate-200 pt-5">
                        <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <ImageIcon size={18} />
                            Product Images
                        </h4>

                        {/* Main Image */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Main Image</label>
                            <div className="flex gap-4 items-start">
                                {mainImage ? (
                                    <div className="relative w-32 h-32 bg-slate-100 rounded-xl overflow-hidden border-2 border-amber-500">
                                        <img src={mainImage} alt="Main" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setMainImage("")}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                                        >
                                            <X size={14} />
                                        </button>
                                        <span className="absolute bottom-1 left-1 text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded">Main</span>
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400">
                                        <ImageIcon size={24} />
                                        <span className="text-xs mt-1">No image</span>
                                    </div>
                                )}
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition text-sm">
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
                                        className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm"
                                    >
                                        <Link size={16} />
                                        Add URL
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Thumbnail Images */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Thumbnail Images ({thumbnailImages.length}/5)
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {thumbnailImages.map((url, index) => (
                                    <div key={index} className="relative w-20 h-20 bg-slate-100 rounded-lg overflow-hidden">
                                        <img src={url} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeThumbnail(index)}
                                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {thumbnailImages.length < 5 && (
                                    <>
                                        <label className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-slate-400 transition">
                                            <Upload size={18} />
                                            <span className="text-xs">Upload</span>
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
                                            className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-slate-400 transition"
                                        >
                                            <Link size={18} />
                                            <span className="text-xs">URL</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* URL Input Modal */}
                        {showUrlInput && (
                            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    {addingToMain ? "Main Image URL" : "Thumbnail URL"}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddUrl}
                                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                                    >
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowUrlInput(false); setUrlInput(""); }}
                                        className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {uploading && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                                <Loader2 size={16} className="animate-spin" />
                                Uploading image...
                            </div>
                        )}
                    </div>

                    {/* Toggles */}
                    <div className="flex flex-wrap items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isFeatured}
                                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-300 text-slate-900"
                            />
                            <span className="text-sm text-slate-700">Featured Product</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.inStock}
                                onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-300 text-slate-900"
                            />
                            <span className="text-sm text-slate-700">In Stock</span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-6 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || uploading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-medium disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Update Product
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProducts;
