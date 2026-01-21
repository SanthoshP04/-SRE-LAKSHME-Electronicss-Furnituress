import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Trash2,
    Minus,
    Plus,
    ShoppingBag,
    ArrowRight,
    Loader2,
    Truck
} from "lucide-react";

import Navbar from "../Home/Navbar";
import Footer from "../Home/Footer";
import {
    getCart,
    updateCartQuantity,
    removeFromCart
} from "../../firebase/firebaseServices";

const Cart = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        setLoading(true);
        try {
            if (user?.uid) {
                const firebaseCart = await getCart(user.uid);
                setCartItems(firebaseCart);
            } else {
                setCartItems(JSON.parse(localStorage.getItem("cart")) || []);
            }
        } catch (error) {
            console.error("Cart load error:", error);
            setCartItems(JSON.parse(localStorage.getItem("cart")) || []);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (id, change) => {
        setCartItems(prev =>
            prev.map(item => {
                if (item.id === id) {
                    const newQty = Math.max(1, (item.quantity || 1) + change);

                    if (user?.uid) {
                        updateCartQuantity(user.uid, id, newQty);
                    }

                    return { ...item, quantity: newQty };
                }
                return item;
            })
        );
    };

    const removeItem = async (id) => {
        if (user?.uid) {
            await removeFromCart(user.uid, id);
        }
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = cartItems.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
    );

    const shipping = subtotal > 5000 ? 0 : 499;
    const total = subtotal + shipping;

    const handleCheckout = () => {
        localStorage.setItem("checkoutCart", JSON.stringify(cartItems));
        localStorage.setItem("checkoutTotal", JSON.stringify({ subtotal, shipping, total }));
        navigate("/checkout");
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar user={user} cartCount={cartItems.length} />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">
                    Shopping Cart
                </h1>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-amber-500" size={40} />
                    </div>
                ) : cartItems.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                        <ShoppingBag size={64} className="mx-auto text-slate-300 mb-4" />
                        <h2 className="text-xl font-semibold text-slate-800 mb-2">Your cart is empty</h2>
                        <p className="text-slate-500 mb-6">Looks like you haven't added anything yet.</p>
                        <button
                            onClick={() => navigate("/products")}
                            className="px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition"
                        >
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map(item => (
                                <div
                                    key={item.id}
                                    className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-4"
                                >
                                    {/* Product Image */}
                                    <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-4xl">{item.image || "📦"}</span>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-slate-800 line-clamp-2 mb-1">
                                            {item.name}
                                        </h3>
                                        <p className="text-lg font-bold text-slate-800 mb-3">
                                            ₹{(item.price || 0).toLocaleString()}
                                        </p>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center border border-slate-200 rounded-lg">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="p-2 hover:bg-slate-100 transition"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="w-10 text-center font-medium">
                                                    {item.quantity || 1}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="p-2 hover:bg-slate-100 transition"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Line Total */}
                                    <div className="hidden sm:block text-right">
                                        <p className="text-lg font-bold text-slate-800">
                                            ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 sticky top-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Order Summary</h3>

                                <div className="space-y-3 mb-4 pt-4 border-t border-slate-100">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Shipping</span>
                                        <span className={shipping === 0 ? "text-emerald-600" : ""}>
                                            {shipping === 0 ? "FREE" : `₹${shipping}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between text-lg font-bold text-slate-800 pt-4 border-t border-slate-200 mb-6">
                                    <span>Total</span>
                                    <span>₹{total.toLocaleString()}</span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2"
                                >
                                    Proceed to Checkout
                                    <ArrowRight size={18} />
                                </button>

                                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                                    <Truck size={16} />
                                    <span>Free shipping on orders over ₹5,000</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Cart;
