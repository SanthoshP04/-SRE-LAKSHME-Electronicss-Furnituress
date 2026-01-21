import React, { useState, useEffect } from "react";
import { Package, Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";
import { deleteProduct } from "../../../firebase/firebaseServices";
import AddProducts from "./AddProducts";
import EditProducts from "./EditProducts";

const Products = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // View state: 'list', 'add', 'edit'
    const [view, setView] = useState("list");
    const [editingProductId, setEditingProductId] = useState(null);

    // Fetch products from Firestore
    useEffect(() => {
        const productsRef = collection(db, "products");
        const q = query(productsRef, orderBy("createdAt", "desc"));

        const unsub = onSnapshot(q, (snapshot) => {
            const productList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setProducts(productList);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const handleDelete = async (productId) => {
        try {
            await deleteProduct(productId);
            setDeleteConfirm(null);
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Error deleting product. Please try again.");
        }
    };

    const openEditPage = (productId) => {
        setEditingProductId(productId);
        setView("edit");
    };

    const handleBack = () => {
        setView("list");
        setEditingProductId(null);
    };

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const getStatusColor = (product) => {
        if (product.inStock === false || product.stock === 0) return "bg-red-100 text-red-700";
        if (product.stock < 10) return "bg-amber-100 text-amber-700";
        return "bg-emerald-100 text-emerald-700";
    };

    const getStatusText = (product) => {
        if (product.inStock === false || product.stock === 0) return "Out of Stock";
        if (product.stock < 10) return "Low Stock";
        return "In Stock";
    };

    // Render Add Product Page
    if (view === "add") {
        return <AddProducts onBack={handleBack} onSuccess={handleBack} />;
    }

    // Render Edit Product Page
    if (view === "edit" && editingProductId) {
        return <EditProducts productId={editingProductId} onBack={handleBack} onSuccess={handleBack} />;
    }

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Products</h3>
                    <p className="text-sm text-slate-500">Manage your product inventory</p>
                </div>
                <button
                    onClick={() => setView("add")}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl transition font-medium"
                >
                    <Plus size={18} />
                    Add Product
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition bg-white"
                    >
                        <option value="">All Categories</option>
                        <option value="Electricals">Electricals</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Appliances">Appliances</option>
                        <option value="Lighting">Lighting</option>
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Category</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Stock</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        No products found. Add your first product!
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-xl flex items-center justify-center text-lg sm:text-xl overflow-hidden flex-shrink-0">
                                                    {product.imageUrl ? (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                                        />
                                                    ) : null}
                                                    <span style={{ display: product.imageUrl ? 'none' : 'block' }}>
                                                        {product.image || "📦"}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="font-medium text-slate-800 block break-words text-sm sm:text-base">{product.name}</span>
                                                    {product.isFeatured && (
                                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded mt-1 inline-block">Featured</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 hidden sm:table-cell">{product.category}</td>
                                        <td className="px-4 sm:px-6 py-4 font-medium text-slate-800 text-left">₹{product.price?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-slate-600 hidden md:table-cell">{product.stock || 0}</td>
                                        <td className="px-4 sm:px-6 py-4 text-left">
                                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(product)}`}>
                                                {getStatusText(product)}
                                            </span>
                                        </td>
                                        <td className="px-2 sm:px-6 py-4">
                                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                                                <button
                                                    onClick={() => openEditPage(product.id)}
                                                    className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} className="text-slate-500" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(product.id)}
                                                    className="p-1.5 sm:p-2 hover:bg-red-100 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} className="text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200">
                    <p className="text-sm text-slate-500">
                        Showing {filteredProducts.length} of {products.length} products
                    </p>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Product</h3>
                        <p className="text-slate-600 mb-6">
                            Are you sure you want to delete this product? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
