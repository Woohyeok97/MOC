'use server';

import { createClient } from '@/shared/api/supabase/server';
import { redirect } from 'next/navigation';

// 인증 관련 서버 액션 모음
// 'use server'로 선언된 함수는 공개 API 엔드포인트와 동일하게 취급 — 내부에서 인증 검증 필수

export async function signOut() {
  const supabase = await createClient();

  // 1. 쿠키에서 access_token, refresh_token 삭제 + Supabase DB의 refresh_token 레코드 제거 -> 이후 해당 refresh_token으로 재발급 시도 시 실패 → 완전한 로그아웃 처리
  await supabase.auth.signOut();

  // 2. 홈으로 이동 — 새 요청이 발생하면 서버가 빈 쿠키를 읽어 비로그인 UI로 자동 렌더링
  redirect('/'); // revalidatePath 불필요 (인증 상태는 캐시가 아닌 쿠키에서 매 요청마다 읽음)
}
