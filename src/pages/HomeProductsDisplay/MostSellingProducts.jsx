import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ShoppingCart, Heart, ChevronRight, TrendingUp } from "lucide-react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { addToCart, toggleWishlist, getProductById, getReviewStats, getWishlist } from "../../firebase/firebaseServices";

const MostSellingProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [reviewStats, setReviewStats] = useState({});
    const [wishlistedItems, setWishlistedItems] = useState(new Set());
    const navigate = useNavigate();

    // Auth listener
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser || null);
        });
        return () => unsub();
    }, []);

    // Load existing wishlist items
    useEffect(() => {
        const loadWishlistItems = async () => {
            if (user?.uid) {
                try {
                    const wishlist = await getWishlist(user.uid);
                    const ids = new Set(wishlist.map(item => item.productId));
                    setWishlistedItems(ids);
                } catch (error) {
                    console.error("Error loading wishlist:", error);
                }
            }
        };
        loadWishlistItems();
    }, [user]);

    // Fetch most selling products based on orders
    useEffect(() => {
        const fetchMostSellingProducts = async () => {
            try {
                // Get all orders
                const ordersRef = collection(db, "orders");
                const ordersSnapshot = await getDocs(ordersRef);

                // Count product sales from order items
                const productSalesCount = {};

                ordersSnapshot.docs.forEach((orderDoc) => {
                    const orderData = orderDoc.data();
                    const items = orderData.items || [];

                    items.forEach((item) => {
                        const productId = item.productId;
                        const quantity = item.quantity || 1;

                        if (productId) {
                            productSalesCount[productId] =
                                (productSalesCount[productId] || 0) + quantity;
                        }
                    });
                });

                // Sort products by sales count
                const sortedProductIds = Object.entries(productSalesCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([productId]) => productId);

                // Fetch product details for top selling products
                const productPromises = sortedProductIds.map((id) =>
                    getProductById(id)
                );
                const productDetails = await Promise.all(productPromises);

                // Filter out null products and add sales count
                const validProducts = productDetails
                    .filter((p) => p !== null)
                    .map((p) => ({
                        ...p,
                        salesCount: productSalesCount[p.id] || 0,
                    }));

                // If we have less than 8 products from orders, get remaining from products collection
                if (validProducts.length < 8) {
                    const productsRef = collection(db, "products");
                    const q = query(productsRef, orderBy("createdAt", "desc"), limit(8));
                    const productsSnapshot = await getDocs(q);

                    const allProducts = productsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                        salesCount: productSalesCount[doc.id] || 0,
                    }));

                    // Add products that are not already in validProducts
                    const existingIds = new Set(validProducts.map((p) => p.id));
                    const additionalProducts = allProducts
                        .filter((p) => !existingIds.has(p.id))
                        .slice(0, 8 - validProducts.length);

                    setProducts([...validProducts, ...additionalProducts]);
                    // Fetch review stats
                    await fetchReviewStats([...validProducts, ...additionalProducts]);
                } else {
                    setProducts(validProducts);
                    await fetchReviewStats(validProducts);
                }
            } catch (error) {
                console.error("Error fetching most selling products:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchReviewStats = async (productList) => {
            const stats = {};
            await Promise.all(productList.map(async (p) => {
                const s = await getReviewStats(p.id);
                stats[p.id] = s;
            }));
            setReviewStats(stats);
        };

        fetchMostSellingProducts();
    }, []);

    const handleAddToCart = async (product) => {
        if (!user) {
            navigate("/");
            return;
        }
        try {
            await addToCart(user.uid, product);
        } catch (error) {
            console.error("Error adding to cart:", error);
        }
    };

    const handleToggleWishlist = async (product) => {
        if (!user) {
            navigate("/");
            return;
        }
        try {
            const result = await toggleWishlist(user.uid, product);
            if (result.action === "added") {
                setWishlistedItems(prev => new Set([...prev, product.id]));
                const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
                if (!localWishlist.find(item => item.productId === product.id)) {
                    localWishlist.push({ productId: product.id, ...product });
                    localStorage.setItem("wishlist", JSON.stringify(localWishlist));
                }
            } else if (result.action === "removed") {
                setWishlistedItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(product.id);
                    return newSet;
                });
                const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
                const filtered = localWishlist.filter(item => item.productId !== product.id);
                localStorage.setItem("wishlist", JSON.stringify(filtered));
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error);
        }
    };

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    if (loading) {
        return (
            <section className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp size={22} className="text-green-600" />
                        Most Selling Products
                    </h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="bg-gray-100 border border-gray-200 rounded-xl overflow-hidden animate-pulse"
                        >
                            <div className="aspect-square bg-gray-200" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 rounded w-1/2" />
                                <div className="h-6 bg-gray-200 rounded w-1/3" />
                                <div className="h-10 bg-gray-200 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return null; // Don't show section if no products
    }

    return (
        <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp size={22} className="text-green-600" />
                    Most Selling Products
                </h3>
                <button
                    onClick={() => navigate("/products")}
                    className="text-gray-600 flex items-center gap-1 hover:text-gray-800 transition"
                >
                    View All <ChevronRight size={16} />
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition group cursor-pointer"
                        onClick={() => handleProductClick(product.id)}
                    >
                        {/* Product Image */}
                        <div className="aspect-square flex items-center justify-center text-6xl bg-gray-100 relative overflow-hidden">
                            {/* Best Seller Badge */}
                            {product.salesCount > 0 && (
                                <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1 z-10">
                                    <TrendingUp size={12} />
                                    {product.salesCount} sold
                                </span>
                            )}

                            {/* Wishlist Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleWishlist(product);
                                }}
                                className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition z-10 ${wishlistedItems.has(product.id)
                                    ? "bg-pink-100"
                                    : "bg-white sm:opacity-0 sm:group-hover:opacity-100 hover:bg-pink-50"
                                    }`}
                            >
                                <Heart
                                    size={16}
                                    className={wishlistedItems.has(product.id)
                                        ? "text-pink-500 fill-pink-500"
                                        : "text-gray-600 hover:text-pink-500"
                                    }
                                />
                            </button>

                            {/* Product Image/Emoji */}
                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-2"
                                />
                            ) : (
                                <span>{product.image || "📦"}</span>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                            <h4 className="font-medium mb-1 line-clamp-2 hover:text-gray-600 min-h-[2.5rem]">
                                {product.name}
                            </h4>

                            {/* Rating */}
                            <div className="flex items-center gap-1 text-sm mb-2">
                                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                <span>{reviewStats[product.id]?.avgRating || product.rating || "4.5"}</span>
                                <span className="text-gray-400">
                                    ({reviewStats[product.id]?.count || product.reviews || 0})
                                </span>
                            </div>

                            {/* Price */}
                            <div className="mb-3">
                                <span className="font-bold text-lg">
                                    ₹{product.price?.toLocaleString()}
                                </span>
                                {product.originalPrice && (
                                    <span className="ml-2 text-sm text-gray-400 line-through">
                                        ₹{product.originalPrice.toLocaleString()}
                                    </span>
                                )}
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(product);
                                }}
                                disabled={product.inStock === false}
                                className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm ${product.inStock === false
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-gray-800 text-white hover:bg-gray-700"
                                    }`}
                            >
                                <ShoppingCart size={16} />
                                {product.inStock === false ? "Out of Stock" : "Add to Cart"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default MostSellingProducts;
