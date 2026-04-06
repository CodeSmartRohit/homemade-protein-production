/**
 * Centralized API configuration with robust fallbacks for production.
 * This ensures that even if environment variables are missing during client-side execution,
 * the application can still communicate with the backend.
 */

const getBaseUrl = () => {
    // Priority 1: Environment Variable
    let url = process.env.NEXT_PUBLIC_API_URL;
    
    // Priority 2: Hardcoded Production Fallback (Railway)
    if (!url) {
        url = 'https://homemade-protein-production-production.up.railway.app/api';
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
