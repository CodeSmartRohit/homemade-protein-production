import { STORAGE_BASE_URL } from './config';

/**
 * Resolves a product's image path to a full URL.
 * Handles absolute URLs (like Unsplash), local storage paths (from Railway),
 * and missing images with a premium placeholder.
 */
export const resolveImageUrl = (path) => {
    // 1. Missing Path: Return Placeholder
    if (!path) {
        return '/placeholder-food.jpg';
    }

    // 2. Absolute URL (already fully qualified)
    if (path.startsWith('http')) {
        return path;
    }

    // 3. Local/Relative Path: Resolve to Railway storage domain
    // Ensure path starts with a slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Construct the full storage URL
    return `${STORAGE_BASE_URL}${normalizedPath}`;
};
