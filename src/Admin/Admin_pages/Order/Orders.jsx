import React, { useState, useEffect } from "react";
import { ShoppingCart, Search, Eye, Package, Truck, CheckCircle, XCircle, Clock, Loader2, X, Calendar, CreditCard, MapPin } from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

const Orders = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingOrder, setUpdatingOrder] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [loadingOrder, setLoadingOrder] = useState(false);

    // Load orders from Firebase in real-time
    useEffect(() => {
        setLoading(true);
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Format date
                date: doc.data().createdAt?.toDate().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                }) || "N/A"
            }));
            setOrders(ordersData);
            setLoading(false);
        }, (error) => {
            console.error("Error loading orders:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleStatusUpdate = async (orderId, newStatus) => {
        setUpdatingOrder(orderId);
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
                status: newStatus,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error("Error updating order status:", error);
            alert("Failed to update order status");
        } finally {
            setUpdatingOrder(null);
        }
    };

    const handleViewOrderDetails = async (orderId) => {
        setLoadingOrder(true);
        try {
            const orderRef = doc(db, "orders", orderId);
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
                setSelectedOrder({ id: orderSnap.id, ...orderSnap.data() });
                setShowOrderModal(true);
            } else {
                alert("Order not found");
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            alert("Failed to load order details");
        } finally {
            setLoadingOrder(false);
        }
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "N/A";
        let date;
        if (dateValue.toDate && typeof dateValue.toDate === 'function') {
            date = dateValue.toDate();
        } else if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else if (dateValue instanceof Date) {
            date = dateValue;
        } else {
            return "N/A";
        }
        return date.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusConfig = (status) => {
        switch (status) {
            case "Delivered": return { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle };
            case "Shipped": return { color: "bg-blue-100 text-blue-700", icon: Truck };
            case "Processing": return { color: "bg-amber-100 text-amber-700", icon: Package };
            case "Pending": return { color: "bg-slate-100 text-slate-700", icon: Clock };
            case "Cancelled": return { color: "bg-red-100 text-red-700", icon: XCircle };
            default: return { color: "bg-slate-100 text-slate-700", icon: Clock };
        }
    };

    const orderStats = [
        { label: "Total Orders", value: orders.length, color: "bg-blue-500" },
        { label: "Delivered", value: orders.filter(o => o.status === "Delivered").length, color: "bg-emerald-500" },
        { label: "Pending", value: orders.filter(o => o.status === "Pending" || o.status === "Processing").length, color: "bg-amber-500" },
        { label: "Cancelled", value: orders.filter(o => o.status === "Cancelled").length, color: "bg-red-500" },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 size={40} className="animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Order Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {orderStats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                        <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                            <ShoppingCart size={20} className="text-white" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                        <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition bg-white"
                    >
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {filteredOrders.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart size={24} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No orders found</h3>
                        <p className="text-slate-500">
                            {searchTerm || statusFilter ? "Try adjusting your filters" : "Orders will appear here when customers place them"}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Order ID</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Date</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Total</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredOrders.map((order) => {
                                        const statusConfig = getStatusConfig(order.status);
                                        const itemCount = order.items?.length || 0;
                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-slate-800">{order.id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-slate-800">{order.customerName || "N/A"}</p>
                                                        <p className="text-sm text-slate-500">{order.customerEmail || "N/A"}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 hidden md:table-cell">{order.date}</td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-slate-800">₹{order.total?.toLocaleString() || "0"}</p>
                                                        <p className="text-sm text-slate-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                        disabled={updatingOrder === order.id}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color} border-0 cursor-pointer disabled:opacity-50`}
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Processing">Processing</option>
                                                        <option value="Shipped">Shipped</option>
                                                        <option value="Delivered">Delivered</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end">
                                                        <button
                                                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                                                            title="View Order Details"
                                                            onClick={() => handleViewOrderDetails(order.id)}
                                                            disabled={loadingOrder}
                                                        >
                                                            {loadingOrder ? (
                                                                <Loader2 size={16} className="text-slate-500 animate-spin" />
                                                            ) : (
                                                                <Eye size={16} className="text-slate-500" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Info */}
                        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Showing {filteredOrders.length} of {orders.length} orders
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Order Details Modal */}
            {showOrderModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Order Details</h2>
                                <p className="text-sm text-slate-500">Order #{selectedOrder.id.slice(-8).toUpperCase()}</p>
                            </div>
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X size={24} className="text-slate-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Order Status & Date */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Order Date</p>
                                    <p className="font-semibold text-slate-800 flex items-center gap-2">
                                        <Calendar size={16} />
                                        {formatDate(selectedOrder.createdAt)}
                                    </p>
                                </div>
                                <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusConfig(selectedOrder.status).color}`}>
                                    {selectedOrder.status || "Pending"}
                                </span>
                            </div>

                            {/* Customer Info */}
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-3">Customer Information</h3>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="font-medium text-slate-800">{selectedOrder.customerName || "N/A"}</p>
                                    <p className="text-sm text-slate-600">{selectedOrder.customerEmail || "N/A"}</p>
                                </div>
                            </div>

                            {/* Items Ordered */}
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-3">Items Ordered</h3>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                            {item.image && (
                                                typeof item.image === 'string' && item.image.startsWith('http') ? (
                                                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                                                ) : (
                                                    <div className="text-4xl">{item.image}</div>
                                                )
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-800">{item.name}</p>
                                                <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-semibold text-slate-800">₹{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shipping Address */}
                            {selectedOrder.shippingAddress && (
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                        <MapPin size={18} />
                                        Shipping Address
                                    </h3>
                                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                        <p className="font-medium text-slate-800 text-base">{selectedOrder.shippingAddress.fullName}</p>
                                        <p className="text-sm text-slate-600">{selectedOrder.shippingAddress.address}</p>
                                        {selectedOrder.shippingAddress.addressLine2 && (
                                            <p className="text-sm text-slate-600">{selectedOrder.shippingAddress.addressLine2}</p>
                                        )}
                                        <p className="text-sm text-slate-600">
                                            {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                                        </p>
                                        <div className="pt-2 border-t border-slate-200 space-y-1">
                                            <p className="text-sm text-slate-600"><span className="font-medium text-slate-700">Phone:</span> {selectedOrder.shippingAddress.phone}</p>
                                            {selectedOrder.shippingAddress.email && (
                                                <p className="text-sm text-slate-600"><span className="font-medium text-slate-700">Email:</span> {selectedOrder.shippingAddress.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Method */}
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                    <CreditCard size={18} />
                                    Payment Method
                                </h3>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-slate-800 font-medium">
                                        {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' :
                                            selectedOrder.paymentMethod === 'upi' ? 'UPI' :
                                                selectedOrder.paymentMethod === 'card' ? 'Credit/Debit Card' :
                                                    selectedOrder.paymentMethod === 'netbanking' ? 'Net Banking' :
                                                        selectedOrder.paymentMethod || "Cash on Delivery"}
                                    </p>
                                </div>
                            </div>

                            {/* Price Summary */}
                            <div className="border-t border-slate-200 pt-4">
                                <h3 className="font-semibold text-slate-800 mb-3">Price Summary</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal</span>
                                        <span>₹{selectedOrder.subtotal?.toLocaleString() || selectedOrder.total?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Shipping</span>
                                        <span>₹{selectedOrder.shipping?.toLocaleString() || 0}</span>
                                    </div>
                                    {selectedOrder.discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>-₹{selectedOrder.discount?.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-200 pt-2">
                                        <span>Total</span>
                                        <span>₹{selectedOrder.total?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Update Status Section */}
                            <div className="border-t border-slate-200 pt-4">
                                <h3 className="font-semibold text-slate-800 mb-3">Update Status</h3>
                                <select
                                    value={selectedOrder.status}
                                    onChange={(e) => {
                                        handleStatusUpdate(selectedOrder.id, e.target.value);
                                        setSelectedOrder({ ...selectedOrder, status: e.target.value });
                                    }}
                                    disabled={updatingOrder === selectedOrder.id}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition bg-white"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
