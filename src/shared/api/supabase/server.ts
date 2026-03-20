// 서버(Server Component, Route Handler, Server Action)용 Supabase 클라이언트 생성 유틸
// 서버는 document.cookie에 접근 불가 → Next.js cookies() API를 대신 사용
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  // Next.js가 현재 요청에 담긴 쿠키 저장소를 반환 (Next.js 15부터 비동기)
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      // Supabase가 "지금 로그인된 사람이 누구야?" 물어볼 때 쿠키에서 access_token 꺼내서 줌
      getAll() {
        return cookieStore.getAll();
      },
      // Supabase가 "이 쿠키 저장해줘" 요청할 때 호출됨
      // 단, Server Component는 응답 쿠키를 직접 수정할 수 없어서 에러가 발생 → 무시
      // 실제 쿠키 갱신(access_token 재발급)은 모든 요청 전에 실행되는 proxy.ts 미들웨어가 담당
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 무시
        }
      }
    }
  });
}
