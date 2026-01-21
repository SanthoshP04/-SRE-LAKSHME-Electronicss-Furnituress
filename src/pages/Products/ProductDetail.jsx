import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Star,
    Heart,
    ShoppingCart,
    Truck,
    Shield,
    RotateCcw,
    ChevronRight,
    Minus,
    Plus,
    Share2,
    Check,
    Loader2,
    X,
    Image,
    Link,
    Send,
    User
} from "lucide-react";
import Navbar from "../Home/Navbar";
import Footer from "../Home/Footer";
import { getProductById, getProducts, addToCart, addToWishlist, getCart, getProductReviews, addProductReview } from "../../firebase/firebaseServices";

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [cartCount, setCartCount] = useState(0);
    const [addedToCart, setAddedToCart] = useState(false);
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [addingToCart, setAddingToCart] = useState(false);

    // Zoom modal state
    const [showZoomModal, setShowZoomModal] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewTitle, setReviewTitle] = useState("");
    const [reviewComment, setReviewComment] = useState("");
    const [reviewImages, setReviewImages] = useState([]);
    const [imageUrlInput, setImageUrlInput] = useState("");
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);

    const user = JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        loadProduct();
        loadCartCount();
        loadReviews();
    }, [id]);

    // Close zoom modal on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") setShowZoomModal(false);
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, []);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const fetchedProduct = await getProductById(id);

            if (fetchedProduct) {
                setProduct(fetchedProduct);

                // Load related products
                const allProducts = await getProducts();
                const related = allProducts
                    .filter(p => p.category === fetchedProduct.category && p.id !== id)
                    .slice(0, 4);
                setRelatedProducts(related);
            }
        } catch (error) {
            console.error("Error loading product:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadReviews = async () => {
        try {
            setReviewsLoading(true);
            const fetchedReviews = await getProductReviews(id);
            setReviews(fetchedReviews);
        } catch (error) {
            console.error("Error loading reviews:", error);
        } finally {
            setReviewsLoading(false);
        }
    };

    const loadCartCount = async () => {
        try {
            if (user?.uid) {
                const firebaseCart = await getCart(user.uid);
                const totalCount = firebaseCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                setCartCount(totalCount);
            } else {
                const cart = JSON.parse(localStorage.getItem("cart") || "[]");
                if (!Array.isArray(cart) || cart.length === 0) {
                    setCartCount(0);
                    return;
                }
                const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                setCartCount(totalCount);
            }
        } catch (error) {
            console.error("Error loading cart count:", error);
            setCartCount(0);
        }
    };

    const handleAddToCart = async () => {
        setAddingToCart(true);
        try {
            if (user?.uid) {
                await addToCart(user.uid, product, quantity);
            }

            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            const existingIndex = cart.findIndex(item => item.productId === product.id);
            if (existingIndex >= 0) {
                cart[existingIndex].quantity += quantity;
            } else {
                cart.push({ productId: product.id, ...product, quantity });
            }
            localStorage.setItem("cart", JSON.stringify(cart));

            const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
            setCartCount(totalCount);

            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 2000);
        } catch (error) {
            console.error("Error adding to cart:", error);
        } finally {
            setAddingToCart(false);
        }
    };

    const handleAddToWishlist = async () => {
        try {
            if (user?.uid) {
                await addToWishlist(user.uid, product);
            }
            const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
            if (!wishlist.find(item => item.productId === product.id)) {
                wishlist.push({ productId: product.id, ...product });
                localStorage.setItem("wishlist", JSON.stringify(wishlist));
            }
            alert("Added to wishlist!");
        } catch (error) {
            console.error("Error adding to wishlist:", error);
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                setReviewImages(prev => [...prev, event.target.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleAddImageUrl = () => {
        if (imageUrlInput.trim()) {
            setReviewImages(prev => [...prev, imageUrlInput.trim()]);
            setImageUrlInput("");
            setShowUrlInput(false);
        }
    };

    const removeReviewImage = (index) => {
        setReviewImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitReview = async () => {
        if (!user?.uid) {
            alert("Please login to submit a review");
            return;
        }
        if (!reviewComment.trim()) {
            alert("Please write a review comment");
            return;
        }

        setSubmittingReview(true);
        try {
            await addProductReview(id, user.uid, {
                userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
                userPhotoURL: user.photoURL || null,
                rating: reviewRating,
                title: reviewTitle,
                comment: reviewComment,
                images: reviewImages
            });

            // Reload reviews
            await loadReviews();

            // Reset form
            setReviewRating(5);
            setReviewTitle("");
            setReviewComment("");
            setReviewImages([]);
            setShowReviewForm(false);
        } catch (error) {
            console.error("Error submitting review:", error);
            alert("Failed to submit review. Please try again.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const getCurrentImage = () => {
        if (product.images && product.images.length > 0) {
            return product.images[selectedImage] || product.imageUrl;
        }
        if (product.thumbnails && product.thumbnails.length > 0) {
            const allImages = [product.imageUrl, ...product.thumbnails].filter(Boolean);
            return allImages[selectedImage];
        }
        return product.imageUrl;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <Navbar user={user} cartCount={cartCount} />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 size={40} className="animate-spin text-gray-500" />
                </main>
                <Footer />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <Navbar user={user} cartCount={cartCount} />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-xl text-slate-500 mb-4">Product not found</p>
                        <button
                            onClick={() => navigate("/products")}
                            className="px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition"
                        >
                            Browse Products
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : product.rating || 4.5;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar user={user} cartCount={cartCount} />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                        <button onClick={() => navigate("/home")} className="hover:text-amber-600">Home</button>
                        <ChevronRight size={14} />
                        <button onClick={() => navigate("/products")} className="hover:text-amber-600">Products</button>
                        <ChevronRight size={14} />
                        <span className="text-slate-800 capitalize">{product.category}</span>
                    </div>

                    {/* Product Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                        {/* Images */}
                        <div className="space-y-4">
                            {/* Main Image - Clickable for zoom */}
                            <div
                                className="bg-white rounded-2xl border border-slate-200 aspect-square flex items-center justify-center overflow-hidden cursor-zoom-in relative group"
                                onClick={() => setShowZoomModal(true)}
                            >
                                {(() => {
                                    if (product.images && product.images.length > 0) {
                                        return (
                                            <img
                                                src={product.images[selectedImage] || product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-contain p-4"
                                            />
                                        );
                                    }
                                    if (product.thumbnails && product.thumbnails.length > 0) {
                                        const allImages = [product.imageUrl, ...product.thumbnails].filter(Boolean);
                                        if (allImages[selectedImage]) {
                                            return (
                                                <img
                                                    src={allImages[selectedImage]}
                                                    alt={product.name}
                                                    className="w-full h-full object-contain p-4"
                                                />
                                            );
                                        }
                                    }
                                    if (product.imageUrl) {
                                        return (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-contain p-4"
                                            />
                                        );
                                    }
                                    return <span className="text-[150px]">{product.image || "📦"}</span>;
                                })()}
                                {/* Zoom hint overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 transition bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                                        Click to zoom
                                    </span>
                                </div>
                            </div>

                            {/* Thumbnail Gallery */}
                            {product.images && product.images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {product.images.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${selectedImage === index
                                                ? "border-amber-500"
                                                : "border-slate-200 hover:border-slate-300"
                                                }`}
                                        >
                                            <img
                                                src={img}
                                                alt={`${product.name} ${index + 1}`}
                                                className="w-full h-full object-contain p-1"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Fallback for thumbnails array */}
                            {(!product.images || product.images.length <= 1) && product.thumbnails && product.thumbnails.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    <button
                                        onClick={() => setSelectedImage(0)}
                                        className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${selectedImage === 0 ? "border-amber-500" : "border-slate-200 hover:border-slate-300"
                                            }`}
                                    >
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <span className="text-2xl flex items-center justify-center h-full">{product.image || "📦"}</span>
                                        )}
                                    </button>
                                    {product.thumbnails.map((thumb, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index + 1)}
                                            className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${selectedImage === index + 1
                                                ? "border-amber-500"
                                                : "border-slate-200 hover:border-slate-300"
                                                }`}
                                        >
                                            <img src={thumb} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-contain p-1" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded capitalize">{product.category}</span>
                                <span className={`px-2 py-1 text-xs font-medium rounded ${product.inStock !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                    {product.inStock !== false ? "In Stock" : "Out of Stock"}
                                </span>
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">{product.name}</h1>
                            <p className="text-slate-500 mb-4">by {product.brand || "ElectroFurn"}</p>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center gap-1">
                                    <Star size={18} className="text-amber-400 fill-amber-400" />
                                    <span className="font-semibold">{avgRating}</span>
                                </div>
                                <span className="text-slate-400">|</span>
                                <span className="text-slate-500">{reviews.length || product.reviews || 0} reviews</span>
                                <button className="ml-auto p-2 hover:bg-slate-100 rounded-lg">
                                    <Share2 size={18} className="text-slate-500" />
                                </button>
                            </div>

                            <div className="flex items-end gap-3 mb-6">
                                <span className="text-3xl font-bold text-slate-800">₹{product.price?.toLocaleString()}</span>
                                {product.originalPrice && (
                                    <>
                                        <span className="text-lg text-slate-400 line-through">₹{product.originalPrice?.toLocaleString()}</span>
                                        <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-semibold rounded">{discount}% OFF</span>
                                    </>
                                )}
                            </div>

                            <p className="text-slate-600 mb-6">{product.description || "Premium quality product with excellent features and build quality."}</p>

                            {/* Quantity & Add to Cart */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center border border-slate-200 rounded-xl">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="p-3 hover:bg-slate-100 transition"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="w-12 text-center font-semibold">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="p-3 hover:bg-slate-100 transition"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    disabled={addingToCart || product.inStock === false}
                                    className={`flex-1 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 disabled:opacity-70 ${addedToCart
                                        ? "bg-emerald-500 text-white"
                                        : "bg-gray-800 hover:bg-gray-500 text-white"
                                        }`}
                                >
                                    {addingToCart ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : addedToCart ? (
                                        <><Check size={20} /> Added!</>
                                    ) : (
                                        <><ShoppingCart size={20} /> Add to Cart</>
                                    )}
                                </button>
                                <button
                                    onClick={handleAddToWishlist}
                                    className="p-3 border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition"
                                >
                                    <Heart size={20} className="text-slate-600" />
                                </button>
                            </div>

                            {/* Features */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-200">
                                    <Truck size={20} className="text-amber-500 mb-1" />
                                    <span className="text-xs text-slate-600 text-center">Free Delivery</span>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-200">
                                    <Shield size={20} className="text-amber-500 mb-1" />
                                    <span className="text-xs text-slate-600 text-center">Warranty</span>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-200">
                                    <RotateCcw size={20} className="text-amber-500 mb-1" />
                                    <span className="text-xs text-slate-600 text-center">Easy Returns</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Customer Reviews ({reviews.length})</h3>
                            {user && (
                                <button
                                    onClick={() => setShowReviewForm(!showReviewForm)}
                                    className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-500 transition"
                                >
                                    Write a Review
                                </button>
                            )}
                        </div>

                        {/* Review Form */}
                        {showReviewForm && user && (
                            <div className="bg-slate-50 rounded-xl p-6 mb-6">
                                <h4 className="font-semibold text-slate-800 mb-4">Write Your Review</h4>

                                {/* Star Rating */}
                                <div className="mb-4">
                                    <label className="text-sm text-slate-600 mb-2 block">Rating</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setReviewRating(star)}
                                                className="p-1"
                                            >
                                                <Star
                                                    size={28}
                                                    className={`transition ${star <= reviewRating ? "text-amber-400 fill-amber-400" : "text-slate-300"}`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="mb-4">
                                    <label className="text-sm text-slate-600 mb-2 block">Title (optional)</label>
                                    <input
                                        type="text"
                                        value={reviewTitle}
                                        onChange={(e) => setReviewTitle(e.target.value)}
                                        placeholder="Summarize your review"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                {/* Comment */}
                                <div className="mb-4">
                                    <label className="text-sm text-slate-600 mb-2 block">Your Review</label>
                                    <textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        placeholder="Share your experience with this product..."
                                        rows={4}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                    />
                                </div>

                                {/* Image Upload */}
                                <div className="mb-4">
                                    <label className="text-sm text-slate-600 mb-2 block">Add Photos (optional)</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {reviewImages.map((img, index) => (
                                            <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                                                <img src={img} alt={`Review ${index + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeReviewImage(index)}
                                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <label className="px-4 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition flex items-center gap-2 text-sm">
                                            <Image size={16} />
                                            Upload Image
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                        </label>
                                        <button
                                            onClick={() => setShowUrlInput(!showUrlInput)}
                                            className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition flex items-center gap-2 text-sm"
                                        >
                                            <Link size={16} />
                                            Add URL
                                        </button>
                                    </div>
                                    {showUrlInput && (
                                        <div className="flex gap-2 mt-2">
                                            <input
                                                type="url"
                                                value={imageUrlInput}
                                                onChange={(e) => setImageUrlInput(e.target.value)}
                                                placeholder="Paste image URL..."
                                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                            <button
                                                onClick={handleAddImageUrl}
                                                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleSubmitReview}
                                    disabled={submittingReview}
                                    className="w-full py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {submittingReview ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <><Send size={18} /> Submit Review</>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Reviews List */}
                        {reviewsLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 size={32} className="animate-spin text-slate-400" />
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <p>No reviews yet. Be the first to review this product!</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {reviews.map((review) => (
                                    <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0">
                                        <div className="flex items-start gap-4">
                                            {/* User Avatar */}
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {review.userPhotoURL ? (
                                                    <img src={review.userPhotoURL} alt={review.userName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-white text-lg font-bold">
                                                        {review.userName?.charAt(0).toUpperCase() || <User size={20} />}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Review Content */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-slate-800">{review.userName}</span>
                                                    <span className="text-sm text-slate-400">•</span>
                                                    <span className="text-sm text-slate-400">{formatDate(review.createdAt)}</span>
                                                </div>

                                                {/* Stars */}
                                                <div className="flex gap-0.5 mb-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            size={14}
                                                            className={star <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"}
                                                        />
                                                    ))}
                                                </div>

                                                {review.title && (
                                                    <h5 className="font-medium text-slate-800 mb-1">{review.title}</h5>
                                                )}
                                                <p className="text-slate-600">{review.comment}</p>

                                                {/* Review Images */}
                                                {review.images && review.images.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {review.images.map((img, index) => (
                                                            <img
                                                                key={index}
                                                                src={img}
                                                                alt={`Review image ${index + 1}`}
                                                                className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition"
                                                                onClick={() => window.open(img, "_blank")}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Related Products</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {relatedProducts.map((p) => (
                                    <div
                                        key={p.id}
                                        onClick={() => navigate(`/product/${p.id}`)}
                                        className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-lg transition"
                                    >
                                        <div className="aspect-square bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden mb-3">
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <span className="text-4xl">{p.image || "📦"}</span>
                                            )}
                                        </div>
                                        <h4 className="font-medium text-slate-800 text-sm line-clamp-2 mb-2">{p.name}</h4>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-800">₹{p.price?.toLocaleString()}</span>
                                            <div className="flex items-center gap-1">
                                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                                <span className="text-xs text-slate-600">{p.rating || 4.5}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Zoom Modal */}
            {showZoomModal && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowZoomModal(false)}
                >
                    <button
                        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition"
                        onClick={() => setShowZoomModal(false)}
                    >
                        <X size={24} className="text-white" />
                    </button>
                    <img
                        src={getCurrentImage()}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ProductDetail;