# Step 3. Supabase Auth + 구글 로그인

## 목표

구글 OAuth 로그인/로그아웃이 동작하고, 로그인 상태가 서버·클라이언트 컴포넌트에서 일관되게 표시된다.  
헤더에 유저 정보(이름)와 로그아웃 버튼이 노출되며, 비로그인 상태로 보호된 페이지 접근 시 `/signin`으로 리다이렉트된다.

---

## 사용 기술 & 라이브러리

| 패키지 | 용도 | 비고 |
|---|---|---|
| `@supabase/supabase-js` | Supabase JS 클라이언트 | 신규 설치 |
| `@supabase/ssr` | Next.js SSR 환경용 쿠키 기반 Supabase 클라이언트 | 신규 설치 |
| `zustand` | 클라이언트 Auth 상태 관리 | 신규 설치 |
| `prisma` | 로그인 후 users 테이블 동기화 | 기존 |

---

## 구현 순서

1. 패키지 설치
   ```bash
   yarn add @supabase/supabase-js @supabase/ssr zustand
   ```

2. 환경변수 확인 (`.env.local`에 아래 두 키가 있어야 함)
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   ```

3. Supabase 클라이언트 유틸 3개 생성
   - `src/shared/api/supabase/client.ts` — 브라우저용 (`createBrowserClient`)
   - `src/shared/api/supabase/server.ts` — 서버용 (`createServerClient`)
   - `src/shared/api/supabase/proxy.ts` — `updateSession` 함수 (proxy.ts에서 사용)

4. `proxy.ts` 생성 (프로젝트 루트 또는 `src/` 루트)  
   세션 쿠키 갱신 담당. 정적 파일 경로는 matcher에서 제외.

5. `/auth/callback` Route Handler 생성 (`src/app/auth/callback/route.ts`)  
   구글 OAuth 완료 후 Supabase가 리다이렉트하는 엔드포인트:
   - `code`를 세션으로 교환
   - `supabase.auth.getClaims()`로 user 정보 확인
   - `prisma.user.upsert()` 로 users 테이블 동기화
   - `/`로 리다이렉트

6. 로그아웃 서버 액션 생성 (`src/features/auth/api/actions.ts`)
   - `supabase.auth.signOut()` 호출
   - `redirect('/')`

7. Zustand auth store 생성 (`src/features/auth/model/authStore.ts`)
   ```ts
   { user: User | null, setUser: (user) => void }
   ```

8. `AuthInitializer` 생성 (`src/features/auth/ui/AuthInitializer.tsx`)  
   클라이언트 컴포넌트. `initialUser`를 받아 Zustand에 세팅하고, `onAuthStateChange`를 구독해 이후 변화를 동기화.

9. `layout.tsx` 수정
   - `createServerClient().getClaims()`로 user 조회
   - `<AuthInitializer initialUser={user}>` 로 감싸기

10. `/signin` 페이지 생성 (`src/app/signin/page.tsx`)  
    구글 로그인 버튼(`LoginButton`)만 있는 단순 페이지.  
    로그인 상태로 접근 시 `/`로 리다이렉트.

11. `LoginButton` 생성 (`src/features/auth/ui/LoginButton.tsx`)  
    클라이언트 컴포넌트. `createBrowserClient().auth.signInWithOAuth({ provider: 'google' })` 호출.

12. `Header` 위젯 생성 (`src/widgets/header/ui/Header.tsx`)  
    서버 컴포넌트. `getClaims()`로 user 조회.  
    로그인 상태: 유저 이름 + `LogoutButton`(클라이언트 컴포넌트) 표시.  
    비로그인 상태: 로그인 버튼 표시.

13. `layout.tsx`에 `Header` 추가

14. `features/auth/index.ts`, `widgets/header/index.ts` Public API 정리

---

## 구현 지침

- **`getClaims()` 사용 필수**: 서버 코드에서 user 확인 시 `getSession()` 사용 금지.  
  `getSession()`은 쿠키만 읽고 JWT 서명을 검증하지 않아 보안상 취약함.  
  `getClaims()`는 프로젝트의 공개 키로 JWT 서명을 매번 검증함.

- **클라이언트 컴포넌트에서 user 접근**: `useAuthStore()` 사용. `createBrowserClient().auth.getClaims()`를 직접 호출하지 말 것 (깜빡임 발생).

- **로그인/로그아웃 후 서버 컴포넌트 갱신**: 로그인은 `/auth/callback`에서 `redirect('/')`, 로그아웃은 서버 액션에서 `redirect('/')`. `router.refresh()` 불필요.

- **보호된 페이지 목록**: `/designs/new`, `/my/purchases`, `/my/designs`. 이 경로에 비로그인 접근 시 `/signin`으로 리다이렉트. `proxy.ts`의 `updateSession` 또는 각 페이지 서버 컴포넌트에서 처리.

- **FSD 레이어 준수**: 로그인/로그아웃/store는 `features/auth/`에, 헤더는 `widgets/header/`에 위치. 외부에서는 반드시 `index.ts`를 통해서만 import.

---

## 엣지 케이스

- [ ] 콜백에서 `prisma.user.upsert()` 실패 시 → 에러 로깅 후 홈(`/`)으로 리다이렉트 (로그인 자체는 성공 처리, DB 동기화만 재시도 불필요)
- [ ] 이미 가입된 유저가 재로그인 시 → `upsert`이므로 중복 오류 없이 정상 처리
- [ ] 구글 로그인 취소(구글 화면에서 뒤로가기) → Supabase가 `error` 파라미터와 함께 콜백으로 리다이렉트 → `/signin`으로 리다이렉트
- [ ] 콜백 URL에 `error_description` 파라미터가 있을 때 → `/signin`으로 리다이렉트
- [ ] 토큰 만료 중 페이지 이동 → `proxy.ts`가 자동 갱신하므로 사용자는 로그인 상태 유지
- [ ] 로그인 상태로 `/signin` 접근 시 → `/`로 리다이렉트
- [ ] 비로그인 상태로 보호된 페이지 직접 URL 접근 시 → `/signin`으로 리다이렉트

---

## 검증 항목

- [ ] 구글 로그인 후 Supabase `auth.users`와 Prisma `users` 테이블 양쪽에 유저가 생성되는지
- [ ] 동일 유저가 재로그인 시 `users` 테이블에 중복 row가 생기지 않는지
- [ ] 로그인 후 헤더에 유저 이름이 표시되는지
- [ ] 로그아웃 후 헤더에서 유저 정보가 사라지고 로그인 버튼이 나타나는지
- [ ] 페이지 새로고침 후에도 로그인 상태가 유지되는지
- [ ] 비로그인 상태로 `/designs/new` 접근 시 `/signin`으로 이동하는지
- [ ] 로그인 상태로 `/signin` 접근 시 `/`로 이동하는지
