import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    CreditCard,
    Truck,
    Shield,
    Check,
    ChevronRight,
    MapPin,
    Loader2
} from "lucide-react";
import Navbar from "../Home/Navbar";
import Footer from "../Home/Footer";
import { createOrder, clearCart, getUserAddresses } from "../../firebase/firebaseServices";

const Checkout = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState("");
    const [loading, setLoading] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [totals, setTotals] = useState({ subtotal: 0, shipping: 0, discount: 0, total: 0 });
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        paymentMethod: "cod"
    });

    const user = JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        // Load cart data from localStorage (saved from Cart page)
        const savedCart = JSON.parse(localStorage.getItem("checkoutCart") || "[]");
        const savedTotals = JSON.parse(localStorage.getItem("checkoutTotal") || "{}");

        if (savedCart.length === 0) {
            navigate("/cart");
            return;
        }

        setCartItems(savedCart);
        setTotals(savedTotals);

        // Load user's saved addresses and pre-fill
        const loadAddress = async () => {
            if (user?.uid) {
                try {
                    const addresses = await getUserAddresses(user.uid);
                    if (addresses && addresses.length > 0) {
                        // Find default address or use first address
                        const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];

                        // Pre-fill form with saved address
                        setFormData(prev => ({
                            ...prev,
                            fullName: defaultAddress.fullName || prev.fullName,
                            phone: defaultAddress.phone || prev.phone,
                            email: user.email || prev.email,
                            address: defaultAddress.address || prev.address,
                            city: defaultAddress.city || prev.city,
                            state: defaultAddress.state || prev.state,
                            pincode: defaultAddress.pincode || prev.pincode
                        }));
                    } else {
                        // No saved address, just set email
                        setFormData(prev => ({ ...prev, email: user.email }));
                    }
                } catch (error) {
                    console.error("Error loading addresses:", error);
                    // If error loading addresses, just set email
                    setFormData(prev => ({ ...prev, email: user.email }));
                }
            }
        };

        loadAddress();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step < 3) {
            setStep(step + 1);
        } else {
            await placeOrder();
        }
    };

    const placeOrder = async () => {
        setLoading(true);
        try {
            // Ensure we have a valid user
            if (!user?.uid) {
                throw new Error("User must be logged in to place an order");
            }

            const orderData = {
                items: cartItems.map(item => ({
                    productId: item.productId || item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image
                })),
                shippingAddress: {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode
                },
                paymentMethod: formData.paymentMethod,
                subtotal: totals.subtotal,
                shipping: totals.shipping,
                discount: totals.discount,
                total: totals.total
            };

            // Create order in Firebase with verified userId
            const newOrderId = await createOrder(user.uid, orderData);
            console.log(`✅ Order created: ${newOrderId} for user: ${user.uid}`);
            setOrderId(newOrderId);

            // Clear cart
            if (user?.uid) {
                await clearCart(user.uid);
            }
            localStorage.removeItem("cart");
            localStorage.removeItem("checkoutCart");
            localStorage.removeItem("checkoutTotal");

            setOrderPlaced(true);
        } catch (error) {
            console.error("Error placing order:", error);
            alert(`Error placing order: ${error.message || "Please try again."}`);
        } finally {
            setLoading(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <Navbar user={user} cartCount={0} />
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md w-full">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check size={40} className="text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Placed Successfully!</h2>
                        <p className="text-slate-500 mb-6">Thank you for your order. You will receive a confirmation email shortly.</p>
                        <p className="text-lg font-semibold text-slate-800 mb-2">Order ID</p>
                        <p className="text-amber-600 font-mono text-sm mb-6">{orderId}</p>
                        <button
                            onClick={() => navigate("/home")}
                            className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar user={user} cartCount={cartItems.length} />

            <main className="flex-1">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-2xl font-bold text-slate-800 mb-6">Checkout</h1>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center mb-8">
                        {["Shipping", "Payment", "Review"].map((label, i) => (
                            <React.Fragment key={label}>
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step > i + 1 ? "bg-emerald-500 text-white" :
                                        step === i + 1 ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-500"
                                        }`}>
                                        {step > i + 1 ? <Check size={16} /> : i + 1}
                                    </div>
                                    <span className={`ml-2 text-sm font-medium ${step === i + 1 ? "text-slate-800" : "text-slate-500"}`}>
                                        {label}
                                    </span>
                                </div>
                                {i < 2 && <ChevronRight size={20} className="mx-4 text-slate-300" />}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Form */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6">
                                {step === 1 && (
                                    <>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                            <MapPin size={20} className="text-amber-500" />
                                            Shipping Address
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                required
                                                className="px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Phone Number"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                required
                                                className="px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                                className="sm:col-span-2 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                                            />
                                            <textarea
                                                placeholder="Full Address"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                required
                                                rows={3}
                                                className="sm:col-span-2 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-amber-400 resize-none"
                                            />
                                            <input
                                                type="text"
                                                placeholder="City"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                required
                                                className="px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                                            />
                                            <input
                                                type="text"
                                                placeholder="State"
                                                value={formData.state}
                                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                required
                                                className="px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Pincode"
                                                value={formData.pincode}
                                                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                                required
                                                className="px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-amber-400"
                                            />
                                        </div>
                                    </>
                                )}

                                {step === 2 && (
                                    <>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                            <CreditCard size={20} className="text-amber-500" />
                                            Payment Method
                                        </h3>
                                        <div className="space-y-3">
                                            {[
                                                { id: "cod", label: "Cash on Delivery", desc: "Pay when you receive" },
                                                { id: "upi", label: "UPI", desc: "GPay, PhonePe, Paytm" },
                                                { id: "card", label: "Credit/Debit Card", desc: "Visa, Mastercard, RuPay" },
                                                { id: "netbanking", label: "Net Banking", desc: "All major banks" },
                                            ].map((method) => (
                                                <label
                                                    key={method.id}
                                                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${formData.paymentMethod === method.id
                                                        ? "border-amber-500 bg-amber-50"
                                                        : "border-slate-200 hover:border-amber-200"
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="payment"
                                                        value={method.id}
                                                        checked={formData.paymentMethod === method.id}
                                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                                        className="w-4 h-4 text-amber-500"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-slate-800">{method.label}</p>
                                                        <p className="text-sm text-slate-500">{method.desc}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {step === 3 && (
                                    <>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Review Order</h3>
                                        <div className="space-y-4 mb-6">
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <p className="font-medium text-slate-800 mb-1">Shipping Address</p>
                                                <p className="text-sm text-slate-600">
                                                    {formData.fullName}, {formData.address}, {formData.city}, {formData.state} - {formData.pincode}
                                                </p>
                                                <p className="text-sm text-slate-500 mt-1">{formData.phone}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl">
                                                <p className="font-medium text-slate-800 mb-1">Payment Method</p>
                                                <p className="text-sm text-slate-600 capitalize">{formData.paymentMethod.replace("-", " ")}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {cartItems.map((item, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                                    <span className="text-2xl">{item.image}</span>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                                                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                                    </div>
                                                    <p className="font-semibold text-slate-800">₹{(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className="mt-6 flex gap-3">
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setStep(step - 1)}
                                            className="px-6 py-3 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition"
                                        >
                                            Back
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Placing Order...
                                            </>
                                        ) : (
                                            step === 3 ? "Place Order" : "Continue"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Order Summary</h3>
                                <div className="space-y-3 mb-4">
                                    {cartItems.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <span className="text-xl">{item.image}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                                                <p className="text-xs text-slate-500">x{item.quantity}</p>
                                            </div>
                                            <p className="font-medium text-slate-800">₹{item.price?.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2 pt-4 border-t border-slate-100">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Subtotal</span>
                                        <span>₹{totals.subtotal?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-emerald-600">
                                        <span>Shipping</span>
                                        <span>{totals.shipping === 0 ? "FREE" : `₹${totals.shipping}`}</span>
                                    </div>
                                    {totals.discount > 0 && (
                                        <div className="flex justify-between text-sm text-emerald-600">
                                            <span>Discount</span>
                                            <span>-₹{totals.discount?.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between text-lg font-bold text-slate-800 pt-4 mt-4 border-t border-slate-200">
                                    <span>Total</span>
                                    <span>₹{totals.total?.toLocaleString()}</span>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Truck size={14} className="text-emerald-500" />
                                        <span>Free delivery</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Shield size={14} className="text-emerald-500" />
                                        <span>Secure checkout</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Checkout;
