import axios from 'axios';
import { authClient } from './auth-client';
import { useAstroStore } from '../store/astroStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Centrally configured axios instance for API requests.
 * Automatically adds JWT Bearer token to requests if available.
 */
export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

// Request interceptor to add the JWT token to headers
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const session = await authClient.getSession();
      const token = session.data?.session?.token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get session token for API request', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn(
        'API returned 401 Unauthorized. Session may be invalid or user deleted. Logging out...',
      );
      // Force clear session and redirect to login - use store logout to clear localStorage
      useAstroStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
