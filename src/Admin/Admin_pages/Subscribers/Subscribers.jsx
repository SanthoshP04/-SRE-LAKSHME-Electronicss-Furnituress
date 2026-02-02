import React, { useState, useEffect } from "react";
import { collection, onSnapshot, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";
import {
    Mail,
    Calendar,
    Trash2,
    Search,
    Users,
    Loader2,
    CheckCircle,
    XCircle,
    RefreshCw
} from "lucide-react";

const Subscribers = () => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleting, setDeleting] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSubscribers = async () => {
            try {
                const subscribersRef = collection(db, "newsletterSubscribers");
                // Try simple query first (no orderBy to avoid index issues)
                const unsubscribe = onSnapshot(subscribersRef, async (snapshot) => {
                    console.log("Subscribers snapshot received:", snapshot.size, "documents");

                    // Get all users to match emails with photos
                    const usersRef = collection(db, "users");
                    const usersSnap = await getDocs(usersRef);
                    const usersMap = {};
                    usersSnap.forEach(doc => {
                        const userData = doc.data();
                        if (userData.email) {
                            usersMap[userData.email.toLowerCase()] = userData.photoURL || null;
                        }
                    });

                    const subscribersList = snapshot.docs.map((doc) => {
                        const data = doc.data();
                        const email = data.email?.toLowerCase() || "";
                        return {
                            id: doc.id,
                            ...data,
                            photoURL: usersMap[email] || null
                        };
                    });
                    // Sort by subscribedAt in JavaScript
                    subscribersList.sort((a, b) => {
                        const dateA = a.subscribedAt?.toDate?.() || new Date(0);
                        const dateB = b.subscribedAt?.toDate?.() || new Date(0);
                        return dateB - dateA;
                    });
                    setSubscribers(subscribersList);
                    setLoading(false);
                    setError(null);
                }, (err) => {
                    console.error("Error fetching subscribers:", err);
                    setError(err.message || "Failed to load subscribers. Check Firestore security rules.");
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (err) {
                console.error("Error setting up subscriber listener:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchSubscribers();
    }, []);

    const handleDelete = async (email) => {
        if (!window.confirm(`Are you sure you want to remove ${email} from the newsletter?`)) {
            return;
        }

        try {
            setDeleting(email);
            await deleteDoc(doc(db, "newsletterSubscribers", email));
        } catch (error) {
            console.error("Error deleting subscriber:", error);
            alert("Failed to delete subscriber. Please try again.");
        } finally {
            setDeleting(null);
        }
    };

    const filteredSubscribers = subscribers.filter((subscriber) =>
        subscriber.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (timestamp) => {
        if (!timestamp) return "N/A";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 mb-2">Unable to Load Subscribers</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <div className="bg-white rounded-lg p-4 text-left text-sm text-slate-700">
                        <p className="font-semibold mb-2">To fix this, update your Firestore Security Rules:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Go to Firebase Console → Firestore → Rules</li>
                            <li>Add this rule inside your rules:</li>
                        </ol>
                        <pre className="mt-2 bg-slate-100 p-3 rounded text-xs overflow-x-auto">
                            {`match /newsletterSubscribers/{email} {
  allow read, write: if true;
}`}
                        </pre>
                        <li className="list-decimal list-inside mt-2">Click "Publish" and refresh this page</li>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Newsletter Subscribers</h1>
                    <p className="text-slate-500">Manage your newsletter subscription list</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                    <Users size={20} className="text-slate-600" />
                    <span className="text-slate-700 font-semibold">{subscribers.length} Total</span>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                />
            </div>

            {/* Subscribers Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {filteredSubscribers.length === 0 ? (
                    <div className="p-8 text-center">
                        <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">
                            {searchQuery ? "No subscribers found matching your search" : "No newsletter subscribers yet"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600">#</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600">Email</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600">Subscribed Date</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600">Status</th>
                                    <th className="text-left py-4 px-6 font-semibold text-slate-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubscribers.map((subscriber, index) => (
                                    <tr
                                        key={subscriber.id}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition"
                                    >
                                        <td className="py-4 px-6 text-slate-500">{index + 1}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                {subscriber.photoURL ? (
                                                    <img
                                                        src={subscriber.photoURL}
                                                        alt={subscriber.email}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                                                        referrerPolicy="no-referrer"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold"
                                                    style={{ display: subscriber.photoURL ? 'none' : 'flex' }}
                                                >
                                                    {subscriber.email?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <span className="font-medium text-slate-700">{subscriber.email}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Calendar size={16} />
                                                {formatDate(subscriber.subscribedAt)}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            {subscriber.active !== false ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                                    <CheckCircle size={14} />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                                                    <XCircle size={14} />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => handleDelete(subscriber.email)}
                                                disabled={deleting === subscriber.email}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                                title="Remove subscriber"
                                            >
                                                {deleting === subscriber.email ? (
                                                    <RefreshCw size={18} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={18} />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Users className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm">Total Subscribers</p>
                            <p className="text-2xl font-bold text-slate-800">{subscribers.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm">Active</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {subscribers.filter(s => s.active !== false).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Mail className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm">This Month</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {subscribers.filter(s => {
                                    if (!s.subscribedAt) return false;
                                    const date = s.subscribedAt.toDate ? s.subscribedAt.toDate() : new Date(s.subscribedAt);
                                    const now = new Date();
                                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscribers;
