'use client';
import { ApiClient } from '@idu/api-client';
import { useAuth } from './auth-store';

export const api = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  getAccessToken: () => useAuth.getState().token,
  onTokenRefreshed: (t) => useAuth.getState().setToken(t),
  onUnauthorized: () => {
    useAuth.getState().clear();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },
});
