// 미들웨어용 세션 자동 갱신 유틸
// 사용자가 페이지를 이동할 때마다 서버에 요청이 오는데, 그 요청이 실제 처리되기 전에 먼저 실행됨
// access_token(1시간짜리 신분증)이 만료됐으면 refresh_token으로 새 것을 발급받아 쿠키를 갱신
// → 사용자는 로그아웃 버튼을 누르기 전까지 자동으로 로그인 유지
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // 기본 응답 — 토큰이 아직 살아있으면 이 객체를 그대로 반환
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // 요청에 담긴 쿠키에서 현재 access_token, refresh_token 읽기
        getAll() {
          return request.cookies.getAll();
        },
        // 새 access_token 발급 시 호출됨 — 요청과 응답 양쪽 쿠키를 모두 갱신해야 함
        // 응답에만 쓰면 이번 요청 중 서버 컴포넌트가 여전히 만료된 쿠키를 읽게 되므로 둘 다 갱신
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        }
      }
    }
  );

  // ⚠️ 이 줄 삭제·이동 금지
  // getClaims() 호출이 내부적으로 access_token 만료를 감지하고 재발급을 트리거함
  // 이 줄이 없으면 토큰 갱신이 일어나지 않아 1시간마다 로그아웃됨
  await supabase.auth.getClaims();

  return supabaseResponse;
}
