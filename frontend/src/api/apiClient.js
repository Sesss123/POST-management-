import axios from 'axios';
import { API_BASE_URL } from './config';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Handle Authentication Errors (401)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const isLoginRequest = error.config.url.includes('/auth/login');
      const isLoginPage = window.location.pathname.includes('/login');
      
      if (!isLoginRequest && !isLoginPage) {
        window.location.href = '/login?expired=true';
      }
    }

    // 2. Handle Subscription/Permission Errors (403)
    if (error.response && error.response.status === 403) {
      // Check if it's a subscription lock message
      const message = error.response.data?.message?.toLowerCase() || '';
      if (message.includes('subscription') || message.includes('plan')) {
        // Redirect to a subscription status page or show a non-intrusive lock
        console.warn('Subscription lock detected');
        // window.location.href = '/settings?tab=subscription&locked=true';
      }
    }

    // 3. Handle Network/Server Errors
    if (!error.response) {
      console.error('Network Error: Please check if the backend is running.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
