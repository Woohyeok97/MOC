import { cache } from 'react';
import { createClient } from '@/shared/api/supabase/server';
import type { UserProfile } from '@/entities/user/user.type';

// 현재 로그인 유저 정보 (cache를 사용하여 한 요청 내 여러 서버 컴포넌트에서 호출해도 getClaims()는 1회만 실행)
export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient();

  const result = await supabase.auth.getClaims();
  if (result.error) return null;

  const claims = result.data?.claims;
  if (!claims) return null;

  return {
    id: claims.sub,
    name: (claims.user_metadata?.full_name ?? claims.user_metadata?.name ?? null) as string | null,
    avatarUrl: (claims.user_metadata?.avatar_url ?? null) as string | null
  };
});
