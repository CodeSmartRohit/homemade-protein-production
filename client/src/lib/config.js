/**
 * Centralized API configuration with robust fallbacks for production.
 * This ensures that even if environment variables are missing during client-side execution,
 * the application can still communicate with the backend.
 */

const getBaseUrl = () => {
    // Priority 1: Environment Variable
    let url = process.env.NEXT_PUBLIC_API_URL;
    
    // Priority 2: Window location detection in browser
    if (!url && typeof window !== 'undefined') {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
            url = 'http://localhost:5000/api';
        }
    }

    // Priority 3: Hardcoded Production Fallback (Render)
    if (!url) {
        url = 'https://homemade-protein-production.onrender.com/api';
    }

    if (url.endsWith('/')) url = url.slice(0, -1);
    if (!url.endsWith('/api')) url = `${url}/api`;
    
    return url;
};

const getStorageUrl = () => {
    const apiBase = getBaseUrl();
    // Storage is served at the root (without /api suffix)
    return apiBase.replace(/\/api$/, '');
};

export const API_BASE_URL = getBaseUrl();
export const STORAGE_BASE_URL = getStorageUrl();
