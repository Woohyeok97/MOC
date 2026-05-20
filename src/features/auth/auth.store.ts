import { create } from 'zustand';
import type { UserProfileType } from '@/entities/user/user.type';

interface AuthState {
  user: UserProfileType | null;
  setUser: (user: UserProfileType | null) => void;
}

// 클라이언트에서 인증 유저 상태를 공유하는 zustand 스토어
export const useAuthStore = create<AuthState>(set => ({
  user: null,
  setUser: user => set({ user })
}));
