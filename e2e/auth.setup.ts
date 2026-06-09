// E2E 인증 셋업 — 본 테스트 전에 1회 실행
// 구글 OAuth 화면을 건너뛰고 Supabase에 직접 로그인해 세션을 발급받은 뒤,
// 그 세션을 브라우저 쿠키로 주입해 로그인 상태를 e2e/.auth/user.json에 저장한다.
import { test as setup } from '@playwright/test';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ context }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 1. 테스트 계정으로 이메일/비번 로그인 → 세션(access_token, refresh_token) 획득
  const supabase = createClient(supabaseUrl, anonKey);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_USER_EMAIL!,
    password: process.env.TEST_USER_PASSWORD!,
  });

  if (error || !data.session) {
    throw new Error(`테스트 계정 로그인 실패: ${error?.message ?? '세션 없음'}`);
  }

  // 2. 앱과 동일한 @supabase/ssr에게 쿠키를 만들게 한다 (포맷/청크 분할 자동 일치)
  //    인메모리 jar의 setAll로 정확한 형식의 쿠키 배열을 캡처
  let captured: { name: string; value: string }[] = [];
  const ssrClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => [],
      setAll: (cookies) => {
        captured = cookies.map(({ name, value }) => ({ name, value }));
      },
    },
  });

  await ssrClient.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  // 3. 캡처한 세션 쿠키를 브라우저 컨텍스트에 주입
  await context.addCookies(
    captured.map((cookie) => ({
      ...cookie,
      domain: 'localhost',
      path: '/',
    }))
  );

  // 4. 로그인된 상태를 파일로 저장 → 모든 테스트가 재사용
  await context.storageState({ path: authFile });
});
