import { jwtDecode } from 'jwt-decode';
import { authClient } from './auth-client';

export interface DecodedToken {
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

/**
 * Gets the current session token and decodes it.
 * @returns The decoded token or null if no token is available.
 */
export const getDecodedToken = async (): Promise<DecodedToken | null> => {
  try {
    const session = await authClient.getSession();
    const token = session.data?.session?.token;

    if (!token) return null;

    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error('Failed to decode JWT token', error);
    return null;
  }
};

/**
 * Checks if the current JWT token is expired.
 * @returns True if expired or no token exists, false otherwise.
 */
export const isTokenExpired = async (): Promise<boolean> => {
  const decoded = await getDecodedToken();
  if (!decoded) return true;

  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};
