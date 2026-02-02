/**
 * API Configuration
 * Central configuration for backend API URL
 */

// Use environment variable in production, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || "https://sre-lakshme-electronicss-furnitures-plum.vercel.app";

export default API_URL;
