import { cache } from 'react';
import { createClient } from '@/shared/api/supabase/server';
import type { UserProfile } from '@/shared/types/auth';

// React.cache()로 감싸서 한 요청 내 여러 서버 컴포넌트에서 호출해도 getClaims()는 1회만 실행
// ex) layout.tsx와 Header 위젯이 동시에 호출해도 네트워크/암호 연산 중복 없음
export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient();
  const {
    data: { claims }
  } = await supabase.auth.getClaims();

  if (!claims) return null;

  return {
    id: claims.sub,
    name: (claims.user_metadata?.full_name ?? claims.user_metadata?.name ?? null) as string | null,
    avatarUrl: (claims.user_metadata?.avatar_url ?? null) as string | null
  };
});
