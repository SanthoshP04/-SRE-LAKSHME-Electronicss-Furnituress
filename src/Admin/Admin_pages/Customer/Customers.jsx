import React, { useState, useEffect } from "react";
import { Users, Search, Mail, Phone, Calendar, MoreVertical, Eye, Edit, Trash2, Loader2 } from "lucide-react";
import { collection, query, onSnapshot, doc, deleteDoc, getDocs, where } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

const Customers = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load customers from Firebase
    useEffect(() => {
        setLoading(true);
        const usersRef = collection(db, "users");

        const unsubscribe = onSnapshot(usersRef, async (snapshot) => {
            const customersData = await Promise.all(
                snapshot.docs.map(async (userDoc) => {
                    const userData = userDoc.data();

                    // Get order count and total spent for this customer
                    const ordersRef = collection(db, "orders");
                    const q = query(ordersRef, where("userId", "==", userDoc.id));
                    const ordersSnap = await getDocs(q);

                    const orders = ordersSnap.docs.map(doc => doc.data());
                    const orderCount = orders.length;
                    const totalSpent = orders
                        .filter(o => o.status !== "Cancelled")
                        .reduce((sum, order) => sum + (order.total || 0), 0);

                    // Determine status based on activity
                    let status = "Inactive";
                    if (orderCount > 0) {
                        status = orderCount >= 5 ? "VIP" : "Active";
                    }

                    return {
                        id: userDoc.id,
                        name: userData.displayName || userData.email?.split('@')[0] || "User",
                        email: userData.email || "N/A",
                        phone: userData.phone || userData.phoneNumber || "N/A",
                        orders: orderCount,
                        spent: totalSpent,
                        joined: userData.createdAt?.toDate().toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric"
                        }) || "N/A",
                        status: status,
                        avatar: (userData.displayName || userData.email || "U").substring(0, 2).toUpperCase()
                    };
                })
            );

            setCustomers(customersData);
            setLoading(false);
        }, (error) => {
            console.error("Error loading customers:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteCustomer = async (customerId) => {
        if (!window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
            return;
        }

        try {
            await deleteDoc(doc(db, "users", customerId));
            alert("Customer deleted successfully");
        } catch (error) {
            console.error("Error deleting customer:", error);
            alert("Failed to delete customer");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Active": return "bg-emerald-100 text-emerald-700";
            case "VIP": return "bg-violet-100 text-violet-700";
            case "Inactive": return "bg-slate-100 text-slate-500";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    const getAvatarColor = (name) => {
        const colors = [
            "bg-blue-500", "bg-emerald-500", "bg-violet-500",
            "bg-amber-500", "bg-rose-500", "bg-cyan-500"
        ];
        return colors[name.charCodeAt(0) % colors.length];
    };

    const customerStats = [
        { label: "Total Customers", value: customers.length, color: "bg-blue-500" },
        { label: "Active", value: customers.filter(c => c.status === "Active").length, color: "bg-emerald-500" },
        { label: "VIP", value: customers.filter(c => c.status === "VIP").length, color: "bg-violet-500" },
        { label: "Inactive", value: customers.filter(c => c.status === "Inactive").length, color: "bg-slate-400" },
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
            {/* Customer Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {customerStats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                        <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                            <Users size={20} className="text-white" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                        <p className="text-sm text-slate-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search customers by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                    />
                </div>
            </div>

            {/* Customers Grid */}
            {filteredCustomers.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users size={24} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No customers found</h3>
                    <p className="text-slate-500">
                        {searchTerm ? "Try adjusting your search terms" : "Customers will appear here when they register"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCustomers.map((customer) => (
                        <div key={customer.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 ${getAvatarColor(customer.name)} rounded-full flex items-center justify-center text-white font-bold`}>
                                        {customer.avatar}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">{customer.name}</h4>
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                                            {customer.status}
                                        </span>
                                    </div>
                                </div>
                                <button className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                                    <MoreVertical size={16} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Mail size={14} className="text-slate-400" />
                                    <span className="truncate">{customer.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Phone size={14} className="text-slate-400" />
                                    <span>{customer.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Calendar size={14} className="text-slate-400" />
                                    <span>Joined {customer.joined}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <div>
                                    <p className="text-lg font-bold text-slate-800">₹{customer.spent.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">{customer.orders} orders</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                                        title="View"
                                        onClick={() => alert("Customer details view coming soon")}
                                    >
                                        <Eye size={16} className="text-slate-500" />
                                    </button>
                                    <button
                                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                                        title="Edit"
                                        onClick={() => alert("Customer edit coming soon")}
                                    >
                                        <Edit size={16} className="text-slate-500" />
                                    </button>
                                    <button
                                        className="p-2 hover:bg-red-100 rounded-lg transition"
                                        title="Delete"
                                        onClick={() => handleDeleteCustomer(customer.id)}
                                    >
                                        <Trash2 size={16} className="text-red-500" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Customers;
