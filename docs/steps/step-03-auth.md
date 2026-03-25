# Step 3. Supabase Auth + 구글 로그인

## 목표

구글 OAuth 로그인/로그아웃이 동작하고, 로그인 상태가 서버·클라이언트 컴포넌트에서 일관되게 표시된다.  
헤더에 유저 정보(이름)와 로그아웃 버튼이 노출되며, 비로그인 상태로 보호된 페이지 접근 시 `/signin`으로 리다이렉트된다.

---

## 사용 기술 & 라이브러리

| 패키지                  | 용도                                             | 비고      |
| ----------------------- | ------------------------------------------------ | --------- |
| `@supabase/supabase-js` | Supabase JS 클라이언트                           | 신규 설치 |
| `@supabase/ssr`         | Next.js SSR 환경용 쿠키 기반 Supabase 클라이언트 | 신규 설치 |
| `zustand`               | 클라이언트 Auth 상태 관리                        | 신규 설치 |
| `prisma`                | 로그인 후 users 테이블 동기화                    | 기존      |

---

## 구현 순서

1. 패키지 설치

   ```bash
   yarn add @supabase/supabase-js @supabase/ssr zustand
   ```

2. 환경변수 확인 (`.env.local`에 아래 두 키가 있어야 함)

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

3. Supabase 클라이언트 유틸 3개 생성
   - `src/shared/api/supabase/client.ts` — 브라우저용 (`createBrowserClient`)
   - `src/shared/api/supabase/server.ts` — 서버용 (`createServerClient` + Next.js `cookies()` 연동)
   - `src/shared/api/supabase/proxy.ts` — 미들웨어용 (`updateSession` 함수)

4. `proxy.ts` 생성 (프로젝트 루트)  
   `proxy.ts`의 `updateSession`을 호출해 모든 요청에서 세션 쿠키 자동 갱신.  
   정적 파일 경로(`/_next`, `/favicon.ico` 등)는 matcher에서 제외.

5. `/auth/callback` Route Handler 생성 (`src/app/auth/callback/route.ts`)  
   구글 OAuth 완료 후 Supabase가 리다이렉트하는 엔드포인트:
   - URL에 `error` 또는 `error_description` 파라미터 있으면 `/signin`으로 리다이렉트
   - `exchangeCodeForSession(code)`로 임시 code → access_token + refresh_token 교환
   - `getClaims()`로 userId, name 추출 후 `prisma.user.upsert()`로 users 테이블 동기화
   - DB 동기화 실패해도 로그인 자체는 성공 처리 (에러 로깅 후 `/`로 리다이렉트)

- 참고: Prisma 클라이언트 싱글턴은 `src/shared/api/prisma.ts`에서 관리 (`PrismaPg` adapter 주입)

6. 로그아웃 서버 액션 생성 (`src/features/auth/api/actions.ts`)
   - `supabase.auth.signOut()` 호출 — 쿠키 삭제 + Supabase DB의 refresh_token 레코드 제거
   - `redirect('/')` — 새 요청 발생 시 서버가 빈 쿠키를 읽어 비로그인 UI로 자동 렌더링
   - `revalidatePath` 불필요 (인증 상태는 캐시가 아닌 쿠키에서 매 요청마다 읽음)

7. `UserProfile` 타입 및 Zustand auth store 생성
   - `src/shared/types/auth.ts` — `UserProfile { id, name, avatarUrl }` 타입 정의  
     (Supabase `User` 타입 대신 이 프로젝트에서 실제로 쓰는 필드만 정의)
   - `src/features/auth/model/authStore.ts` — `{ user: UserProfile | null, setUser }` store 생성

8. `AuthProvider` 생성 (`src/features/auth/ui/AuthProvider.tsx`)  
   클라이언트 컴포넌트. `initialUser`를 받아 Zustand store에 세팅하고 children을 렌더링.
   - `onAuthStateChange` 구독 불필요 — 로그인/로그아웃이 모두 `redirect()`로 끝나므로 서버가 새 `initialUser`를 자동으로 내려줌 (서버가 진실의 원천)

9. `layout.tsx` 수정
   - `getCurrentUser()` 헬퍼 함수 분리 (`src/features/auth/api/getCurrentUser.ts`)  
     `React.cache()`로 감싸 한 요청 내 여러 서버 컴포넌트에서 호출해도 `getClaims()` 1회만 실행
   - `layout.tsx`에서 `getCurrentUser()`로 user 조회 후 `<AuthProvider initialUser={user}>`로 감싸기

10. `/signin` 페이지 생성 (`src/app/signin/page.tsx`)  
    구글 로그인 버튼(`GoogleSignInButton`)이 있는 단순 페이지 본문을 구현.  
    헤더/푸터는 `layout.tsx`에서 전역으로 렌더링.

11. `GoogleSignInButton` 생성 (`src/features/auth/ui/GoogleSignInButton.tsx`)  
    클라이언트 컴포넌트. `createClient().auth.signInWithOAuth({ provider: 'google' })` 호출.  
    `queryParams.prompt = 'select_account'`로 계정 선택 화면을 유도.

12. `Header` 위젯 생성 (`src/widgets/header/ui/Header.tsx`)  
    서버 컴포넌트. `getCurrentUser()`로 user 조회.  
    로그인 상태: 유저 이름 + `LogoutButton`(클라이언트 컴포넌트) 표시.  
    비로그인 상태: 로그인 버튼 표시.

13. `layout.tsx`에 `Header`, `Footer` 추가 (전역 공통 레이아웃)

---

## 구현 지침

- **`getClaims()` 사용 필수**: 서버 코드에서 user 확인 시 `getSession()` 사용 금지.  
  `getSession()`은 쿠키만 읽고 JWT 서명을 검증하지 않아 보안상 취약함.  
  `getClaims()`는 Supabase 공개 키로 JWT 서명을 로컬 검증함 (네트워크 요청 없음).

- **`getUser()` 대신 `getClaims()` 사용 이유**: `getUser()`는 Supabase 서버에 네트워크 요청을 보내지만, `getClaims()`는 로컬에서 JWT 서명만 검증함. 이 프로젝트는 `proxy.ts`가 모든 요청 전에 토큰을 갱신하므로 `getClaims()`가 읽는 토큰은 항상 최신 상태임.

- **클라이언트 컴포넌트에서 user 접근**: `useAuthStore()` 사용. `createBrowserClient().auth.getClaims()`를 직접 호출하지 말 것 (깜빡임 발생).

- **`getCurrentUser()` null-safe 처리**: `getClaims()` 결과에서 `data`가 null일 수 있으므로 `data?.claims`로 접근하고, `result.error`/`!claims`면 `null` 반환.

- **로그인/로그아웃 후 서버 컴포넌트 갱신**: 로그인은 `/auth/callback`에서 `redirect('/')`, 로그아웃은 서버 액션에서 `redirect('/')`. `router.refresh()` 불필요.

- **보호된 페이지 목록**: `/designs/new`, `/my/purchases`, `/my/designs`. 이 경로에 비로그인 접근 시 `/signin`으로 리다이렉트. `proxy.ts` 또는 각 페이지 서버 컴포넌트에서 처리.

- **FSD 레이어 준수**: 로그인/로그아웃/store는 `features/auth/`에, 헤더는 `widgets/`에 위치.

---

## 엣지 케이스

- ⬜ 콜백에서 `prisma.user.upsert()` 실패 시 → 에러 로깅 후 홈(`/`)으로 리다이렉트 (로그인 자체는 성공 처리, DB 동기화만 재시도 불필요)

- ✅ 이미 가입된 유저가 재로그인 시 → `upsert`이므로 중복 오류 없이 정상 처리

- ✅ 구글 로그인 취소(구글 화면에서 뒤로가기) → Supabase가 `error` 파라미터와 함께 콜백으로 리다이렉트 → `/signin`으로 리다이렉트

- ✅ 콜백 URL에 `error_description` 파라미터가 있을 때 → `/signin`으로 리다이렉트

- ⬜ 토큰 만료 중 페이지 이동 → `proxy.ts`(미들웨어)가 refresh_token으로 새 access_token 자동 발급하므로 사용자는 로그인 상태 유지

- ⬜ 로그인 상태로 `/signin` 접근 시 → `/`로 리다이렉트

- ⬜ 비로그인 상태로 보호된 페이지 직접 URL 접근 시 → `/signin`으로 리다이렉트

---

## 검증 항목

- ✅ 구글 로그인 후 Supabase `auth.users`와 Prisma `users` 테이블 양쪽에 유저가 생성되는지

- ✅ 동일 유저가 재로그인 시 `users` 테이블에 중복 row가 생기지 않는지

- ✅ 로그인 후 헤더에 유저 이름이 표시되는지

- ✅ 로그아웃 후 헤더에서 유저 정보가 사라지고 로그인 버튼이 나타나는지

- ✅ 페이지 새로고침 후에도 로그인 상태가 유지되는지

- ⬜ 비로그인 상태로 `/designs/new` 접근 시 `/signin`으로 이동하는지

- ⬜ 로그인 상태로 `/signin` 접근 시 `/`로 이동하는지
