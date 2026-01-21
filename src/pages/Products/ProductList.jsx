import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Star,
    Heart,
    ShoppingCart,
    Grid,
    List,
    SlidersHorizontal,
    X,
    Loader2,
    Search
} from "lucide-react";
import Navbar from "../Home/Navbar";
import Footer from "../Home/Footer";
import {
    getProducts,
    addToCart,
    toggleWishlist,
    seedProducts,
    getCart,
    getWishlist,
    getProductReviews
} from "../../firebase/firebaseServices";

const ProductList = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [viewMode, setViewMode] = useState("grid");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [priceRange, setPriceRange] = useState([0, 100000]);
    const [sortBy, setSortBy] = useState("featured");
    const [cartCount, setCartCount] = useState(0);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(null);
    const [wishlistedItems, setWishlistedItems] = useState(new Set());
    const [productRatings, setProductRatings] = useState({});

    const categories = [
        { id: "all", name: "All Products" },
        { id: "Electricals", name: "Electricals" },
        { id: "Furniture", name: "Furniture" },
        { id: "Appliances", name: "Appliances" },
        { id: "Lighting", name: "Lighting" },
    ];

    const user = JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        loadProducts();
        loadCartCount();
        loadWishlistItems();
    }, []);

    // Sync URL params with state
    useEffect(() => {
        const categoryFromUrl = searchParams.get("category");
        const searchFromUrl = searchParams.get("search");

        if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
            // Map URL category names to match database categories
            const categoryMap = {
                'electronics': 'Electricals',
                'furniture': 'Furniture',
                'appliances': 'Appliances',
                'lighting': 'Lighting'
            };
            setSelectedCategory(categoryMap[categoryFromUrl.toLowerCase()] || categoryFromUrl);
        }
        if (searchFromUrl !== null && searchFromUrl !== searchQuery) {
            setSearchQuery(searchFromUrl);
        }
    }, [searchParams]);

    const loadWishlistItems = async () => {
        if (user?.uid) {
            try {
                const wishlist = await getWishlist(user.uid);
                const ids = new Set(wishlist.map(item => item.productId));
                setWishlistedItems(ids);
            } catch (error) {
                console.error("Error loading wishlist:", error);
            }
        } else {
            // Load from localStorage for guests
            const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
            const ids = new Set(wishlist.map(item => item.productId));
            setWishlistedItems(ids);
        }
    };

    const loadProductRatings = async (productIds) => {
        const ratings = {};
        await Promise.all(
            productIds.map(async (productId) => {
                try {
                    const reviews = await getProductReviews(productId);
                    if (reviews && reviews.length > 0) {
                        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                        ratings[productId] = {
                            rating: avgRating,
                            count: reviews.length
                        };
                    } else {
                        ratings[productId] = { rating: 0, count: 0 };
                    }
                } catch (error) {
                    console.error(`Error loading reviews for product ${productId}:`, error);
                    ratings[productId] = { rating: 0, count: 0 };
                }
            })
        );
        setProductRatings(ratings);
    };

    const loadProducts = async () => {
        try {
            setLoading(true);
            let fetchedProducts = await getProducts();

            // If no products exist, seed the database
            if (fetchedProducts.length === 0) {
                await seedProducts();
                fetchedProducts = await getProducts();
            }

            setProducts(fetchedProducts);

            // Load ratings for all products
            const productIds = fetchedProducts.map(p => p.id);
            await loadProductRatings(productIds);
        } catch (error) {
            console.error("Error loading products:", error);
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

    const handleAddToCart = async (e, product) => {
        e.stopPropagation();
        setAddingToCart(product.id);

        try {
            if (user?.uid) {
                await addToCart(user.uid, product);
            }

            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            const existingIndex = cart.findIndex(item => item.productId === product.id);
            if (existingIndex >= 0) {
                cart[existingIndex].quantity += 1;
            } else {
                cart.push({ productId: product.id, ...product, quantity: 1 });
            }
            localStorage.setItem("cart", JSON.stringify(cart));

            const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
            setCartCount(totalCount);
        } catch (error) {
            console.error("Error adding to cart:", error);
        } finally {
            setAddingToCart(null);
        }
    };

    const handleAddToWishlist = async (e, product) => {
        e.stopPropagation();
        try {
            if (user?.uid) {
                const result = await toggleWishlist(user.uid, product);
                if (result.action === "added") {
                    setWishlistedItems(prev => new Set([...prev, product.id]));
                } else if (result.action === "removed") {
                    setWishlistedItems(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(product.id);
                        return newSet;
                    });
                }
            }

            const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
            const existingIndex = wishlist.findIndex(item => item.productId === product.id);
            if (existingIndex === -1) {
                wishlist.push({ productId: product.id, ...product });
                if (!user?.uid) setWishlistedItems(prev => new Set([...prev, product.id]));
            } else {
                wishlist.splice(existingIndex, 1);
                if (!user?.uid) {
                    setWishlistedItems(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(product.id);
                        return newSet;
                    });
                }
            }
            localStorage.setItem("wishlist", JSON.stringify(wishlist));
        } catch (error) {
            console.error("Error toggling wishlist:", error);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === "all" || p.category?.toLowerCase() === selectedCategory.toLowerCase();
        const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
        const matchesSearch = !searchQuery ||
            p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesPrice && matchesSearch;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case "price-low":
                return a.price - b.price;
            case "price-high":
                return b.price - a.price;
            case "rating": {
                const ratingA = productRatings[a.id]?.rating || 0;
                const ratingB = productRatings[b.id]?.rating || 0;
                return ratingB - ratingA;
            }
            default:
                return 0;
        }
    });

    const getProductRating = (productId) => {
        return productRatings[productId] || { rating: 0, count: 0 };
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar user={user} cartCount={cartCount} />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col gap-4 mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {searchQuery ? `Search: "${searchQuery}"` :
                                        selectedCategory !== "all" ? selectedCategory : "All Products"}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'} found
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    <SlidersHorizontal size={18} />
                                    <span className="font-medium">Filters</span>
                                </button>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer font-medium text-gray-700"
                                >
                                    <option value="featured">Featured</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="rating">Highest Rated</option>
                                </select>
                                <div className="hidden sm:flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={`p-2 rounded transition ${viewMode === "grid" ? "bg-gray-800 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                                    >
                                        <Grid size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={`p-2 rounded transition ${viewMode === "list" ? "bg-gray-800 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                                    >
                                        <List size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-8">
                        {/* Sidebar Filters */}
                        <aside className={`${showFilters ? "fixed inset-0 z-50 bg-black/50" : "hidden"} lg:relative lg:block lg:bg-transparent`}>
                            <div className={`${showFilters ? "absolute right-0 top-0 h-full w-80 bg-white p-6 shadow-2xl overflow-y-auto" : ""} lg:w-64 lg:flex-shrink-0`}>
                                <div className="lg:sticky lg:top-6 bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-6 lg:hidden">
                                        <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
                                        <button
                                            onClick={() => setShowFilters(false)}
                                            className="p-1 hover:bg-gray-100 rounded"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="mb-6">
                                        <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Category</h4>
                                        <div className="space-y-3">
                                            {categories.map(cat => (
                                                <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        name="category"
                                                        checked={selectedCategory === cat.id}
                                                        onChange={() => setSelectedCategory(cat.id)}
                                                        className="w-4 h-4 text-gray-800 cursor-pointer"
                                                    />
                                                    <span className="text-gray-700 group-hover:text-gray-900 transition">
                                                        {cat.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-6 pt-6 border-t border-gray-200">
                                        <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Price Range</h4>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={priceRange[0]}
                                                onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                                                placeholder="Min"
                                            />
                                            <span className="text-gray-400 font-medium">-</span>
                                            <input
                                                type="number"
                                                value={priceRange[1]}
                                                onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                                                placeholder="Max"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setSelectedCategory("all");
                                            setPriceRange([0, 100000]);
                                        }}
                                        className="w-full py-2.5 text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition font-medium text-sm"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </aside>

                        {/* Products Grid */}
                        <div className="flex-1">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 size={40} className="animate-spin text-gray-600" />
                                </div>
                            ) : (
                                <div className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-6`}>
                                    {sortedProducts.map((product) => {
                                        const { rating, count } = getProductRating(product.id);
                                        return (
                                            <div
                                                key={product.id}
                                                onClick={() => navigate(`/product/${product.id}`)}
                                                className="bg-white rounded-xl border border-gray-300 overflow-hidden group hover:shadow-xl hover:border-gray-400 transition-all cursor-pointer"
                                            >
                                                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 aspect-square flex items-center justify-center text-5xl overflow-hidden">
                                                    {product.badge && (
                                                        <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold rounded-lg z-10 shadow-sm ${product.badge === "Sale" ? "bg-red-500 text-white" :
                                                            product.badge === "New" ? "bg-blue-500 text-white" :
                                                                "bg-gray-800 text-white"
                                                            }`}>
                                                            {product.badge}
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={(e) => handleAddToWishlist(e, product)}
                                                        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition z-10 ${wishlistedItems.has(product.id)
                                                            ? "bg-pink-100"
                                                            : "bg-white sm:opacity-0 sm:group-hover:opacity-100 hover:bg-pink-50"
                                                            }`}
                                                    >
                                                        <Heart
                                                            size={16}
                                                            className={wishlistedItems.has(product.id) ? "text-pink-500 fill-pink-500" : "text-gray-600 hover:text-pink-500"}
                                                        />
                                                    </button>
                                                    {product.imageUrl ? (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.name}
                                                            className="w-full h-full object-contain p-4"
                                                        />
                                                    ) : (
                                                        <span className="text-6xl">{product.image || "📦"}</span>
                                                    )}
                                                </div>
                                                <div className="p-5">
                                                    <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[3rem] leading-tight">
                                                        {product.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="flex items-center gap-1">
                                                            <Star size={16} className={`${rating > 0 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {rating > 0 ? rating.toFixed(1) : 'No ratings'}
                                                            </span>
                                                        </div>
                                                        {count > 0 && (
                                                            <span className="text-xs text-gray-500">
                                                                ({count} {count === 1 ? 'review' : 'reviews'})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <span className="text-xl font-bold text-gray-900">
                                                            ₹{product.price?.toLocaleString()}
                                                        </span>
                                                        {product.originalPrice && (
                                                            <span className="text-sm text-gray-500 line-through">
                                                                ₹{product.originalPrice?.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleAddToCart(e, product)}
                                                        disabled={addingToCart === product.id}
                                                        className="w-full py-2.5 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                                    >
                                                        {addingToCart === product.id ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <ShoppingCart size={16} />
                                                        )}
                                                        Add to Cart
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {!loading && sortedProducts.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-xl border border-gray-300">
                                    <div className="text-5xl mb-4">🔍</div>
                                    <p className="text-gray-600 text-lg font-medium">No products found</p>
                                    <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductList;