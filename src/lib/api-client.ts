import axios from 'axios';
import { useAstroStore } from '../store/astroStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Centrally configured axios instance for API requests.
 * Session cookie is sent automatically via withCredentials.
 */
export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

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
