import React, { useState, useEffect } from "react";
import { ShoppingCart, Search, Eye, Package, Truck, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

const Orders = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingOrder, setUpdatingOrder] = useState(null);

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
                                                            onClick={() => alert("Order details feature coming soon")}
                                                        >
                                                            <Eye size={16} className="text-slate-500" />
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
        </div>
    );
};

export default Orders;
