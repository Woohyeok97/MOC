// 클라이언트 사이드 인증 상태 스토어
// 서버에서 읽은 유저 정보를 클라이언트 컴포넌트에서 접근할 수 있도록 Zustand로 관리
// 클라이언트 컴포넌트에서 유저 정보가 필요하면 이 store를 사용 — createBrowserClient().auth.getClaims() 직접 호출 금지 (깜빡임 발생)
import { create } from 'zustand';
import type { UserProfile } from '@/shared/types/auth';

interface AuthState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  setUser: user => set({ user })
}));
