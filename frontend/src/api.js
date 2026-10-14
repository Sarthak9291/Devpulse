const rawUrl = import.meta.env.VITE_API_URL;
const BASE_URL = rawUrl 
    ? rawUrl.replace(/\/$/, '') 
    : (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');

// Simple API helper with token management
export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const apiCall = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Unauthenticated - token might be expired
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                window.location.href = '/login';
            }
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error.message);
        throw error;
    }
};

export const getBaseUrl = () => BASE_URL;
