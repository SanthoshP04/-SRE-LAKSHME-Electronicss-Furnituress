import React, { useState, useEffect } from "react";
import {
    DollarSign,
    ShoppingBag,
    UserCheck,
    TrendingUp,
    Package,
    Zap,
    Sofa,
    Loader2
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { collection, query, orderBy, limit, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

const DashboardHome = () => {
    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        customers: 0,
        growth: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Load orders
            const ordersRef = collection(db, "orders");
            const ordersQuery = query(ordersRef, orderBy("createdAt", "desc"));

            onSnapshot(ordersQuery, async (ordersSnapshot) => {
                const orders = ordersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const safeGetDate = (val) => {
                    if (!val) return null;
                    return val.toDate ? val.toDate() : new Date(val);
                };

                // Calculate total revenue (excluding cancelled orders)
                const totalRevenue = orders
                    .filter(o => o.status !== "Cancelled")
                    .reduce((sum, order) => sum + (order.total || 0), 0);

                // Get recent orders (last 5)
                const recentOrdersData = orders.slice(0, 5).map(order => ({
                    id: order.id,
                    items: order.items?.map(item => item.name).join(", ") || "N/A",
                    amount: order.total || 0
                }));
                setRecentOrders(recentOrdersData);

                // Calculate growth (compare this month vs last month)
                const now = new Date();
                const thisMonth = orders.filter(o => {
                    const orderDate = safeGetDate(o.createdAt);
                    return orderDate && orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
                });
                const lastMonth = orders.filter(o => {
                    const orderDate = safeGetDate(o.createdAt);
                    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
                    return orderDate && orderDate.getMonth() === lastMonthDate.getMonth() && orderDate.getFullYear() === lastMonthDate.getFullYear();
                });
                const growth = lastMonth.length > 0
                    ? Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100)
                    : 0;

                // Revenue by month for chart (last 12 months)
                const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
                    const date = new Date(now.getFullYear(), now.getMonth() - (11 - i));
                    const monthOrders = orders.filter(o => {
                        const orderDate = safeGetDate(o.createdAt);
                        return orderDate &&
                            orderDate.getMonth() === date.getMonth() &&
                            orderDate.getFullYear() === date.getFullYear() &&
                            o.status !== "Cancelled";
                    });
                    return {
                        month: date.toLocaleDateString("en-US", { month: "short" }),
                        revenue: monthOrders.reduce((sum, o) => sum + (o.total || 0), 0),
                        orders: monthOrders.length
                    };
                });
                setRevenueData(monthlyRevenue);

                // Get customers count
                const usersSnapshot = await getDocs(collection(db, "users"));
                const customersCount = usersSnapshot.size;

                // Get top products
                const productsSnapshot = await getDocs(collection(db, "products"));
                const products = productsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Calculate product sales from orders
                const productSales = {};
                orders.forEach(order => {
                    order.items?.forEach(item => {
                        if (!productSales[item.productId]) {
                            productSales[item.productId] = {
                                name: item.name,
                                sold: 0,
                                price: item.price
                            };
                        }
                        productSales[item.productId].sold += item.quantity || 1;
                    });
                });

                const topProductsData = Object.entries(productSales)
                    .sort((a, b) => b[1].sold - a[1].sold)
                    .slice(0, 4)
                    .map(([id, data]) => ({
                        name: data.name,
                        sold: data.sold,
                        price: data.price,
                        icon: data.name.toLowerCase().includes('sofa') || data.name.toLowerCase().includes('bed') ? Sofa : Zap
                    }));
                setTopProducts(topProductsData);

                setStats({
                    revenue: totalRevenue,
                    orders: orders.length,
                    customers: customersCount,
                    growth: growth
                });

                setLoading(false);
            });
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 size={40} className="animate-spin text-slate-400" />
            </div>
        );
    }

    const dashboardStats = [
        { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "bg-emerald-500", change: `+${stats.growth}%` },
        { label: "Total Orders", value: stats.orders.toString(), icon: ShoppingBag, color: "bg-blue-500", change: `+${stats.growth}%` },
        { label: "Total Customers", value: stats.customers.toString(), icon: UserCheck, color: "bg-violet-500", change: "+15%" },
        { label: "Growth", value: `${stats.growth}%`, icon: TrendingUp, color: "bg-amber-500", change: "+5%" },
    ];

    return (
        <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {dashboardStats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 hover:shadow-md transition"
                    >
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className={`${stat.color} p-2 sm:p-3 rounded-xl`}>
                                <stat.icon size={20} className="text-white sm:w-6 sm:h-6" />
                            </div>
                            <span className="text-emerald-600 text-xs sm:text-sm font-medium bg-emerald-50 px-2 py-1 rounded-full">
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-slate-500 text-xs sm:text-sm">{stat.label}</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-800">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-800">Revenue Overview</h3>
                        <p className="text-sm text-slate-500">Monthly revenue for SRE LAKSHME</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600"></div>
                            <span className="text-sm text-slate-600">Revenue</span>
                        </div>
                    </div>
                </div>
                <div className="h-[300px] sm:h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                                }}
                                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#f59e0b"
                                strokeWidth={3}
                                fill="url(#revenueGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Recent Orders */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Recent Orders</h3>
                    <div className="space-y-3 sm:space-y-4">
                        {recentOrders.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No orders yet</p>
                        ) : (
                            recentOrders.map((order, i) => (
                                <div key={i} className="flex items-center justify-between py-2 sm:py-3 border-b border-slate-100 last:border-0">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                            <ShoppingBag size={16} className="text-amber-600 sm:w-[18px] sm:h-[18px]" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm sm:text-base">Order {order.id}</p>
                                            <p className="text-xs sm:text-sm text-slate-500 truncate max-w-[150px]">{order.items}</p>
                                        </div>
                                    </div>
                                    <span className="text-emerald-600 font-medium text-sm sm:text-base">₹{order.amount.toLocaleString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Top Products</h3>
                    <div className="space-y-3 sm:space-y-4">
                        {topProducts.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No product sales yet</p>
                        ) : (
                            topProducts.map((product, i) => (
                                <div key={i} className="flex items-center justify-between py-2 sm:py-3 border-b border-slate-100 last:border-0">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                            <product.icon size={16} className="text-slate-600 sm:w-[18px] sm:h-[18px]" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm sm:text-base">{product.name}</p>
                                            <p className="text-xs sm:text-sm text-slate-500">{product.sold} sold</p>
                                        </div>
                                    </div>
                                    <span className="text-slate-700 font-medium text-sm sm:text-base">₹{product.price.toLocaleString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default DashboardHome;
