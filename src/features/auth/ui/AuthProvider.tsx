'use client';

// 서버에서 읽은 유저 정보를 클라이언트 Zustand store에 주입하는 Provider
// 서버가 진실의 원천 — 인증 상태 변화(로그인·로그아웃)는 모두 redirect()로 끝나므로 서버가 새 initialUser를 내려줄 때 store가 자동으로 갱신됨
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { UserProfileType } from '@/entities/user/user.type';
import { useAuthStore } from '@/features/auth/auth.store';

interface Props {
  initialUser: UserProfileType | null;
  children: ReactNode;
}

export function AuthProvider({ initialUser, children }: Props) {
  const setUser = useAuthStore(state => state.setUser);

  // layout.tsx에서 getClaims()로 읽은 유저를 store에 세팅 → 클라이언트 첫 렌더부터 유저 정보 바로 사용 가능
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser, setUser]);

  return <>{children}</>;
}
