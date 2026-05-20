// 구글 OAuth 완료 후 Supabase가 리다이렉트하는 엔드포인트
// 1. 구글 로그인 성공 → 구글이 임시 code 발급 → 이 핸들러로 리다이렉트
// 2. code를 진짜 토큰(access_token + refresh_token)으로 교환 후 쿠키 저장
// 3. users 테이블 동기화 후 홈으로 이동
import { prisma } from '@/shared/api/prisma';
import { createClient } from '@/shared/api/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // 구글 로그인 취소(뒤로가기) 또는 OAuth 에러 발생 시 로그인 페이지로
  if (searchParams.get('error') || searchParams.get('error_description')) {
    return NextResponse.redirect(`${origin}/signin`);
  }

  const code = searchParams.get('code');

  if (!code) return NextResponse.redirect(`${origin}/signin`);

  const supabase = await createClient();

  // 1. 임시 code → access_token + refresh_token 교환 및 쿠키 저장
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return NextResponse.redirect(`${origin}/signin`);

  // 2. 쿠키에 저장된 access_token(JWT)에서 유저 정보 추출
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (claims) {
    const userId = claims.sub;
    // 구글 프로필에서 가져온 표시 이름 (full_name 우선, 없으면 name)
    const name = (claims.user_metadata?.full_name ?? claims.user_metadata?.name ?? null) as string | null;
    const avatarUrl = (claims.user_metadata?.avatar_url ?? null) as string | null;

    // 3. 첫 로그인이면 users 테이블에 INSERT, 재로그인이면 이름·아바타 UPDATE
    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: { name, avatarUrl },
        create: { id: userId, name, avatarUrl }
      });
    } catch (prismaError) {
      // DB 동기화 실패해도 로그인 자체는 성공 처리 — 재시도 불필요
      console.error('[auth/callback] prisma.user.upsert 실패:', prismaError);
    }
  }

  // 4. 홈으로 리다이렉트
  return NextResponse.redirect(`${origin}/`);
}
