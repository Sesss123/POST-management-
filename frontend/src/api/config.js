/**
 * Centralized API configuration
 */

const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // Fallback for development/production: use relative paths to support Vite proxy or same-domain hosting
    return '';
};

export const API_BASE_URL = getApiBaseUrl();
