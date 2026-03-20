// 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트 생성 유틸
// 구글 로그인 버튼처럼 브라우저에서 실행되는 코드에서만 사용
// 브라우저는 document.cookie로 쿠키에 직접 접근하기 때문에 별도 설정 불필요
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
