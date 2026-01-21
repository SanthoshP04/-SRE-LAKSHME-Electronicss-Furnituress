import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCbz5oxsUL7tcaHrRCh2py8P4UbqIdqqTs",
    authDomain: "react-firebase-ecommerce-cf036.firebaseapp.com",
    projectId: "react-firebase-ecommerce-cf036",
    storageBucket: "react-firebase-ecommerce-cf036.firebasestorage.app",
    messagingSenderId: "482057030090",
    appId: "1:482057030090:web:90cb09d1d34032fd3ea733",
    measurementId: "G-XV6K7C75D9"
};

const app = initializeApp(firebaseConfig);
console.log("🔥 Firebase Connected:", app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export default app;