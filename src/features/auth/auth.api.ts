import { cache } from 'react';
import { createClient } from '@/shared/api/supabase/server';

// 로그인 여부 확인 및 userId 획득 전용 — DB 미사용, JWT만 읽음
export const getAuthSession = cache(async (): Promise<{ id: string } | null> => {
  const supabase = await createClient();
  const result = await supabase.auth.getClaims();
  if (result.error || !result.data?.claims) return null;
  return { id: result.data.claims.sub };
});
