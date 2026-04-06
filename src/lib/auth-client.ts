import { createAuthClient } from 'better-auth/react';
import { bearer } from 'better-auth/plugins';

export const authClient = createAuthClient({
  baseURL:
    (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001') + '/api/auth',
  plugins: [bearer()],
});
