import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    setDoc
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// ==================== PRODUCTS ====================

export const getProducts = async () => {
    try {
        const productsRef = collection(db, "products");
        const snapshot = await getDocs(productsRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
};

export const getProductById = async (productId) => {
    try {
        const productRef = doc(db, "products", productId);
        const snapshot = await getDoc(productRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching product:", error);
        throw error;
    }
};

export const getProductsByCategory = async (category) => {
    try {
        const productsRef = collection(db, "products");
        const q = query(productsRef, where("category", "==", category));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching products by category:", error);
        throw error;
    }
};

export const addProduct = async (productData) => {
    try {
        const productsRef = collection(db, "products");
        const docRef = await addDoc(productsRef, {
            ...productData,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding product:", error);
        throw error;
    }
};

export const updateProduct = async (productId, productData) => {
    try {
        const productRef = doc(db, "products", productId);
        await updateDoc(productRef, {
            ...productData,
            updatedAt: new Date().toISOString()
        });
        return productId;
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
};

export const deleteProduct = async (productId) => {
    try {
        const productRef = doc(db, "products", productId);
        await deleteDoc(productRef);
        return productId;
    } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
};

// ==================== CART ====================

export const getCart = async (userId) => {
    try {
        const cartRef = collection(db, "users", userId, "cart");
        const snapshot = await getDocs(cartRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching cart:", error);
        throw error;
    }
};

export const addToCart = async (userId, product, quantity = 1) => {
    try {
        const cartRef = collection(db, "users", userId, "cart");
        const q = query(cartRef, where("productId", "==", product.id));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Product already in cart, update quantity
            const cartItem = snapshot.docs[0];
            await updateDoc(doc(db, "users", userId, "cart", cartItem.id), {
                quantity: cartItem.data().quantity + quantity
            });
        } else {
            // Add new product to cart
            await addDoc(cartRef, {
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                imageUrl: product.imageUrl || null,
                quantity: quantity,
                addedAt: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
        throw error;
    }
};

export const updateCartQuantity = async (userId, cartItemId, quantity) => {
    try {
        const cartItemRef = doc(db, "users", userId, "cart", cartItemId);
        await updateDoc(cartItemRef, { quantity });
    } catch (error) {
        console.error("Error updating cart:", error);
        throw error;
    }
};

export const removeFromCart = async (userId, cartItemId) => {
    try {
        await deleteDoc(doc(db, "users", userId, "cart", cartItemId));
    } catch (error) {
        console.error("Error removing from cart:", error);
        throw error;
    }
};

export const clearCart = async (userId) => {
    try {
        const cartRef = collection(db, "users", userId, "cart");
        const snapshot = await getDocs(cartRef);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
    } catch (error) {
        console.error("Error clearing cart:", error);
        throw error;
    }
};

// ==================== WISHLIST ====================

export const getWishlist = async (userId) => {
    try {
        const wishlistRef = collection(db, "users", userId, "wishlist");
        const snapshot = await getDocs(wishlistRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        throw error;
    }
};

export const addToWishlist = async (userId, product) => {
    try {
        const wishlistRef = collection(db, "users", userId, "wishlist");
        const q = query(wishlistRef, where("productId", "==", product.id));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            await addDoc(wishlistRef, {
                productId: product.id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice || null,
                image: product.image || null,
                imageUrl: product.imageUrl || null,
                rating: product.rating || 4.5,
                inStock: product.inStock !== false,
                addedAt: new Date().toISOString()
            });
            return true; // Item was added
        }
        return false; // Item already exists
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        throw error;
    }
};

export const removeFromWishlist = async (userId, wishlistItemId) => {
    try {
        await deleteDoc(doc(db, "users", userId, "wishlist", wishlistItemId));
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        throw error;
    }
};

// Toggle wishlist - add if not exists, remove if exists
export const toggleWishlist = async (userId, product) => {
    try {
        const wishlistRef = collection(db, "users", userId, "wishlist");
        const q = query(wishlistRef, where("productId", "==", product.id));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Product exists in wishlist - remove it
            const docId = snapshot.docs[0].id;
            await deleteDoc(doc(db, "users", userId, "wishlist", docId));
            return { action: "removed" };
        } else {
            // Product not in wishlist - add it
            await addDoc(wishlistRef, {
                productId: product.id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice || null,
                image: product.image || null,
                imageUrl: product.imageUrl || null,
                rating: product.rating || 4.5,
                inStock: product.inStock !== false,
                addedAt: new Date().toISOString()
            });
            return { action: "added" };
        }
    } catch (error) {
        console.error("Error toggling wishlist:", error);
        throw error;
    }
};

// ==================== ORDERS ====================

export const createOrder = async (userId, orderData) => {
    try {
        const ordersRef = collection(db, "orders");
        const orderRef = await addDoc(ordersRef, {
            userId,
            customerName: orderData.shippingAddress?.fullName || "Guest",
            customerEmail: orderData.shippingAddress?.email || "",
            items: orderData.items,
            shippingAddress: orderData.shippingAddress,
            paymentMethod: orderData.paymentMethod,
            subtotal: orderData.subtotal || 0,
            shipping: orderData.shipping || 0,
            discount: orderData.discount || 0,
            total: orderData.total || 0,
            status: "Pending",
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return orderRef.id;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

export const getUserOrders = async (userId) => {
    try {
        const ordersRef = collection(db, "orders");
        // Simple query with only where clause - no composite index needed
        const q = query(ordersRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort by createdAt in JavaScript instead of Firestore
        return orders.sort((a, b) => {
            // Handle Firestore Timestamp objects
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA; // Descending order (newest first)
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};

export const getOrderById = async (orderId) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const snapshot = await getDoc(orderRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching order:", error);
        throw error;
    }
};

// ==================== USER PROFILE ====================

export const getUserProfile = async (userId) => {
    try {
        const userRef = doc(db, "users", userId);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
};

export const updateUserProfile = async (userId, profileData) => {
    try {
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, profileData, { merge: true });
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
};

// ==================== ADDRESSES ====================

export const getUserAddresses = async (userId) => {
    try {
        const addressesRef = collection(db, "users", userId, "addresses");
        const snapshot = await getDocs(addressesRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching addresses:", error);
        throw error;
    }
};

export const addAddress = async (userId, addressData) => {
    try {
        const addressesRef = collection(db, "users", userId, "addresses");
        const docRef = await addDoc(addressesRef, addressData);
        return docRef.id;
    } catch (error) {
        console.error("Error adding address:", error);
        throw error;
    }
};

export const updateAddress = async (userId, addressId, addressData) => {
    try {
        const addressRef = doc(db, "users", userId, "addresses", addressId);
        await updateDoc(addressRef, addressData);
    } catch (error) {
        console.error("Error updating address:", error);
        throw error;
    }
};

// ==================== REVIEWS ====================

export const getProductReviews = async (productId) => {
    try {
        const reviewsRef = collection(db, "reviews");
        // Simple query without orderBy to avoid composite index requirement
        const q = query(
            reviewsRef,
            where("productId", "==", productId)
        );
        const snapshot = await getDocs(q);
        const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by createdAt in JavaScript
        return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
        console.error("Error fetching reviews:", error);
        // Return empty array instead of throwing to prevent UI crash
        return [];
    }
};

export const getReviewStats = async (productId) => {
    try {
        const reviewsRef = collection(db, "reviews");
        const q = query(reviewsRef, where("productId", "==", productId));
        const snapshot = await getDocs(q);
        const reviews = snapshot.docs.map(doc => doc.data());

        if (reviews.length === 0) {
            return { count: 0, avgRating: 0 };
        }

        const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        return {
            count: reviews.length,
            avgRating: (totalRating / reviews.length).toFixed(1)
        };
    } catch (error) {
        console.error("Error fetching review stats:", error);
        return { count: 0, avgRating: 0 };
    }
};

export const addProductReview = async (productId, userId, reviewData) => {
    try {
        const reviewsRef = collection(db, "reviews");
        const docRef = await addDoc(reviewsRef, {
            productId,
            userId,
            userName: reviewData.userName || "Anonymous",
            userPhotoURL: reviewData.userPhotoURL || null,
            rating: reviewData.rating,
            title: reviewData.title || "",
            comment: reviewData.comment,
            images: reviewData.images || [],
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding review:", error);
        throw error;
    }
};

// ==================== SEED DATA (for initial setup) ====================

export const seedProducts = async () => {
    const products = [
        { name: "Smart LED Ceiling Fan with Remote", price: 8999, originalPrice: 12999, image: "🌀", rating: 4.8, reviews: 2456, category: "electricals", badge: "Best Seller", brand: "ElectroMax", inStock: true, description: "Advanced BLDC motor with LED light panel" },
        { name: "Premium L-Shaped Sofa Set", price: 45999, originalPrice: 59999, image: "🛋️", rating: 4.9, reviews: 1823, category: "furniture", badge: "New", brand: "ComfortLiving", inStock: true, description: "Premium fabric with solid wood frame" },
        { name: "Double Door Refrigerator 350L", price: 28999, originalPrice: 35999, image: "🧊", rating: 4.7, reviews: 3102, category: "electricals", badge: null, brand: "CoolTech", inStock: true, description: "Frost-free with inverter compressor" },
        { name: "Modern Wooden Dining Table Set", price: 32999, originalPrice: 42999, image: "🪑", rating: 4.6, reviews: 987, category: "furniture", badge: "Sale", brand: "WoodCraft", inStock: true, description: "6-seater sheesham wood dining set" },
        { name: "Smart Split AC 1.5 Ton 5 Star", price: 38999, originalPrice: 48999, image: "❄️", rating: 4.8, reviews: 1567, category: "electricals", badge: "Popular", brand: "CoolAir", inStock: true, description: "5-star rated with WiFi control" },
        { name: "Queen Size Platform Bed with Storage", price: 24999, originalPrice: 34999, image: "🛏️", rating: 4.7, reviews: 2341, category: "furniture", badge: null, brand: "SleepWell", inStock: true, description: "Hydraulic storage with cushioned headboard" },
        { name: "LED Strip Lights 10M Smart RGB", price: 1299, originalPrice: 1999, image: "💡", rating: 4.4, reviews: 892, category: "electricals", badge: "Sale", brand: "BrightHome", inStock: true, description: "App controlled with music sync" },
        { name: "Executive Office Chair Ergonomic", price: 12999, originalPrice: 17999, image: "💺", rating: 4.6, reviews: 1234, category: "furniture", badge: null, brand: "OfficePro", inStock: true, description: "Lumbar support with adjustable armrests" },
        { name: "Front Load Washing Machine 7kg", price: 32999, originalPrice: 39999, image: "🫧", rating: 4.5, reviews: 756, category: "electricals", badge: null, brand: "CleanMax", inStock: true, description: "Steam wash with smart diagnosis" },
        { name: "3-Seater Fabric Sofa", price: 28999, originalPrice: 38999, image: "🛋️", rating: 4.7, reviews: 543, category: "furniture", badge: "Popular", brand: "ComfortLiving", inStock: true, description: "Premium linen fabric with solid wood legs" },
        { name: "Ceiling Light Chandelier Modern", price: 5999, originalPrice: 8999, image: "💡", rating: 4.3, reviews: 234, category: "electricals", badge: null, brand: "LightArt", inStock: true, description: "Contemporary crystal chandelier" },
        { name: "Wooden Wardrobe 4 Door", price: 35999, originalPrice: 45999, image: "🚪", rating: 4.6, reviews: 876, category: "furniture", badge: "Sale", brand: "WoodCraft", inStock: false, description: "Engineered wood with mirror panel" },
    ];

    try {
        for (const product of products) {
            await addProduct(product);
        }
        console.log("✅ Products seeded successfully!");
    } catch (error) {
        console.error("Error seeding products:", error);
    }
};


