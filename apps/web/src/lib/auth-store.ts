'use client';
import { create } from 'zustand';
import type { AuthUser } from '@idu/api-client';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  ready: boolean;
  setToken: (t: string | null) => void;
  setUser: (u: AuthUser | null) => void;
  setReady: (r: boolean) => void;
  clear: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  ready: false,
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  setReady: (ready) => set({ ready }),
  clear: () => set({ token: null, user: null }),
}));
