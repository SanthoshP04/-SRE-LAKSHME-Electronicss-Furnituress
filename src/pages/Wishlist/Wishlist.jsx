import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Heart,
    ShoppingCart,
    Trash2,
    Star,
    Loader2
} from "lucide-react";
import Navbar from "../Home/Navbar";
import Footer from "../Home/Footer";
import { getWishlist, removeFromWishlist, addToCart, getCart } from "../../firebase/firebaseServices";

const Wishlist = () => {
    const navigate = useNavigate();
    const [cartCount, setCartCount] = useState(0);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removingItem, setRemovingItem] = useState(null);
    const [addingToCart, setAddingToCart] = useState(null);

    const user = JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        loadWishlist();
        loadCartCount();
    }, []);

    const loadWishlist = async () => {
        try {
            setLoading(true);
            if (user?.uid) {
                // Load from Firestore for logged-in users
                const firebaseWishlist = await getWishlist(user.uid);
                setWishlistItems(firebaseWishlist);
            } else {
                // Load from localStorage for guests
                const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
                setWishlistItems(localWishlist);
            }
        } catch (error) {
            console.error("Error loading wishlist:", error);
            // Fallback to localStorage
            const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
            setWishlistItems(localWishlist);
        } finally {
            setLoading(false);
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
                const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                setCartCount(totalCount);
            }
        } catch (error) {
            console.error("Error loading cart count:", error);
            setCartCount(0);
        }
    };

    const removeItem = async (itemId) => {
        setRemovingItem(itemId);
        try {
            const item = wishlistItems.find(i => i.id === itemId || i.productId === itemId);

            if (user?.uid && item?.id) {
                // Remove from Firestore
                await removeFromWishlist(user.uid, item.id);
            }

            // Also remove from localStorage
            const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
            const updatedWishlist = localWishlist.filter(i => i.productId !== (item?.productId || itemId));
            localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));

            // Update state
            setWishlistItems(items => items.filter(i => i.id !== itemId && i.productId !== itemId));
        } catch (error) {
            console.error("Error removing from wishlist:", error);
        } finally {
            setRemovingItem(null);
        }
    };

    const moveToCart = async (item) => {
        const itemKey = item.id || item.productId;
        setAddingToCart(itemKey);
        try {
            const product = {
                id: item.productId || item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                imageUrl: item.imageUrl
            };

            if (user?.uid) {
                await addToCart(user.uid, product);
            }

            // Also update localStorage
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            const existingIndex = cart.findIndex(i => i.productId === product.id);
            if (existingIndex >= 0) {
                cart[existingIndex].quantity += 1;
            } else {
                cart.push({ productId: product.id, ...product, quantity: 1 });
            }
            localStorage.setItem("cart", JSON.stringify(cart));

            const totalCount = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
            setCartCount(totalCount);

            // Remove from wishlist after adding to cart
            await removeItem(itemKey);
        } catch (error) {
            console.error("Error moving to cart:", error);
        } finally {
            setAddingToCart(null);
        }
    };

    const handleProductClick = (item) => {
        const productId = item.productId || item.id;
        navigate(`/product/${productId}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar user={user} cartCount={cartCount} />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-2xl font-bold text-slate-800 mb-6">My Wishlist ({wishlistItems.length})</h1>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={40} className="animate-spin text-gray-500" />
                        </div>
                    ) : wishlistItems.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                            <Heart size={64} className="mx-auto text-slate-300 mb-4" />
                            <h2 className="text-xl font-semibold text-slate-800 mb-2">Your wishlist is empty</h2>
                            <p className="text-slate-500 mb-6">Save items you love for later.</p>
                            <button
                                onClick={() => navigate("/products")}
                                className="px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-600 transition"
                            >
                                Browse Products
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {wishlistItems.map((item) => {
                                const itemKey = item.id || item.productId;
                                return (
                                    <div
                                        key={itemKey}
                                        className="bg-white rounded-xl border border-slate-200 overflow-hidden group hover:shadow-lg transition cursor-pointer"
                                        onClick={() => handleProductClick(item)}
                                    >
                                        <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 aspect-square flex items-center justify-center overflow-hidden">
                                            {item.inStock === false && (
                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                                                    <span className="px-3 py-1 bg-slate-800 text-white text-sm font-medium rounded">Out of Stock</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeItem(itemKey);
                                                }}
                                                disabled={removingItem === itemKey}
                                                className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition disabled:opacity-50 z-10"
                                            >
                                                {removingItem === itemKey ? (
                                                    <Loader2 size={16} className="animate-spin text-red-500" />
                                                ) : (
                                                    <Trash2 size={16} className="text-red-500" />
                                                )}
                                            </button>
                                            {/* Display image properly */}
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain p-2"
                                                />
                                            ) : (
                                                <span className="text-5xl">{item.image || "📦"}</span>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-medium text-slate-800 line-clamp-2 mb-2 min-h-[2.5rem]">{item.name}</h4>
                                            <div className="flex items-center gap-1 mb-2">
                                                <Star size={14} className="text-amber-400 fill-amber-400" />
                                                <span className="text-sm text-slate-600">{item.rating || 4.5}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-lg font-bold text-slate-800">₹{item.price?.toLocaleString()}</span>
                                                {item.originalPrice && (
                                                    <span className="text-sm text-slate-400 line-through">₹{item.originalPrice?.toLocaleString()}</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    moveToCart(item);
                                                }}
                                                disabled={item.inStock === false || addingToCart === itemKey}
                                                className={`w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${item.inStock === false
                                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                    : "bg-amber-500 text-white hover:bg-amber-600"
                                                    } disabled:opacity-70`}
                                            >
                                                {addingToCart === itemKey ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <ShoppingCart size={16} />
                                                )}
                                                Move to Cart
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Wishlist;
