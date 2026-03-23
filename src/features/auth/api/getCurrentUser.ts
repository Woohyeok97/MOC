import { cache } from 'react';
import { createClient } from '@/shared/api/supabase/server';
import type { UserProfile } from '@/shared/types/auth';

// React.cache()로 감싸서 한 요청 내 여러 서버 컴포넌트에서 호출해도 getClaims()는 1회만 실행
// ex) layout.tsx와 Header 위젯이 동시에 호출해도 네트워크/암호 연산 중복 없음
export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient();

  const result = await supabase.auth.getClaims();
  if (result.error) return null; // 비로그인/토큰 만료 상황에서는 getClaims()가 data: null을 반환할 수 있으므로  중첩 구조분해 대신 null-safe 접근으로 런타임 TypeError를 방지

  const claims = result.data?.claims;
  if (!claims) return null;

  return {
    id: claims.sub,
    name: (claims.user_metadata?.full_name ?? claims.user_metadata?.name ?? null) as string | null,
    avatarUrl: (claims.user_metadata?.avatar_url ?? null) as string | null
  };
});
