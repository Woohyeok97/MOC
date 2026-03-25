'use server';

import { createClient } from '@/shared/api/supabase/server';
import { redirect } from 'next/navigation';

// 로그아웃 서버액션
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
