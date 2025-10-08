import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Simple axios instance for authentication endpoints
 * Does NOT use NextAuth session (to avoid circular dependency)
 */
const authApiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Auth-specific API response type
 */
export interface AuthApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Auth API client wrapper - for use in NextAuth config only
 */
export const authApi = {
  post: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await authApiClient.post<AuthApiResponse<T>>(url, data);
    return response.data.data as T;
  },
};

export default authApiClient;
