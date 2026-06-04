# 메인 홈 서버사이드 검색 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메인 홈(`/`)의 가짜 클라이언트 필터링을 진짜 서버사이드 제목 검색으로 바꾼다.

**Architecture:** 검색 상태의 단일 출처는 URL `?query=` 파라미터. 서버 컴포넌트(`page.tsx`)가 query를 읽어 `getDesigns(query)`로 Prisma `WHERE title ILIKE` 검색을 수행하고, 클라이언트(`Header`)는 엔터(폼 submit) 시점에만 URL을 갱신한다. 통합 검증은 Playwright E2E로 한다.

**Tech Stack:** Next.js App Router (서버 컴포넌트), Prisma, Zustand, Playwright. (`getDesigns`는 Prisma+Supabase 결합이라 유닛 테스트 대신 E2E로 회귀 검증한다.)

**참고 스펙:** `docs/superpowers/specs/2026-06-02-home-search-design.md`

---

### Task 1: `getDesigns`에 서버사이드 제목 검색 추가

**Files:**
- Modify: `src/entities/design/design.api.ts:8-20`

- [ ] **Step 1: `getDesigns` 시그니처에 query 인자와 where 조건 추가**

`src/entities/design/design.api.ts`의 `getDesigns`를 아래로 교체한다 (다른 export 함수는 건드리지 않음):

```ts
// 디자인 목록 (query가 있으면 제목 기준 서버사이드 검색)
export const getDesigns = cache(async (query?: string): Promise<DesignWithAuthor[]> => {
  const designs = await prisma.design.findMany({
    where: query ? { title: { contains: query, mode: 'insensitive' } } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { author: true }
  });

  // thumbnail은 스토리지 path로 저장되어 있어 공개 URL로 변환
  const supabase = await createClient();
  return designs.map(design => ({
    ...design,
    thumbnail: getPublicImageUrl(supabase, design.thumbnail)
  }));
});
```

- [ ] **Step 2: 타입 체크로 깨진 곳이 없는지 확인**

Run: `yarn build` (또는 에디터 타입 체크)
Expected: 타입 에러 없음. `getDesigns()` 무인자 호출(다른 사용처)도 `query`가 optional이라 그대로 유효.

- [ ] **Step 3: Commit**

```bash
git add src/entities/design/design.api.ts
git commit -m "feat: getDesigns에 서버사이드 제목 검색 추가"
```

---

### Task 2: 홈 page에서 클라이언트 필터 제거

**Files:**
- Modify: `src/app/(main)/(with-sidebar)/page.tsx`

- [ ] **Step 1: 클라 필터링을 서버 검색 호출로 교체**

`src/app/(main)/(with-sidebar)/page.tsx` 전체를 아래로 교체한다:

```tsx
import { DesignCard } from '@/entities/design/ui/DesignCard';
import { getDesigns } from '@/entities/design/design.api';

type SearchParams = Promise<{ query?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const { query } = await searchParams;
  const designs = await getDesigns(query); // 검색어가 있으면 서버에서 제목 기준으로 필터링된 목록

  return (
    <div className="columns-[200px] gap-2.5 p-4">
      {designs.map(design => (
        <DesignCard key={design.id} design={design} />
      ))}

      {/* 검색 결과가 없을 때 */}
      {designs.length === 0 && (
        <p className="py-20 text-center text-[14px] text-[#91918c]">검색 결과가 없어요</p>
      )}
    </div>
  );
}
```

변경점: `filteredDesigns` 클라 필터 블록 삭제, `getDesigns(query)` 호출로 변경, 렌더에서 `designs` 직접 사용. (기존의 `author.name` 매칭은 스펙대로 제거됨.)

- [ ] **Step 2: 타입/빌드 확인**

Run: `yarn build`
Expected: 타입 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(main)/(with-sidebar)/page.tsx"
git commit -m "refactor: 홈 검색을 클라 필터에서 서버 검색으로 전환"
```

---

### Task 3: Header 검색을 엔터(폼 submit) 시점 실행으로 변경

**Files:**
- Modify: `src/widgets/Header.tsx:4` (import), `:23-39` (핸들러), `:50-59` (검색창 JSX)

- [ ] **Step 1: import에 FormEvent 타입 추가**

`src/widgets/Header.tsx`의 첫 import를 변경:

```tsx
import { useState, type FormEvent } from 'react';
```

- [ ] **Step 2: handleSearch를 폼 submit 핸들러로 변경**

`Header` 함수 안의 `handleSearch`(기존 onChange용)를 아래로 교체한다:

```tsx
  // 엔터(폼 submit) 시 현재 입력값을 URL 쿼리 파라미터에 반영 (빈 값이면 파라미터 제거)
  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue) {
      params.set('query', searchValue);
    } else {
      params.delete('query');
    }
    router.replace(`/?${params.toString()}`);
  };
```

`searchValue` state와 `useState(searchParams.get('query') ?? '')` 초기화는 그대로 둔다 (URL 직접 진입 시 검색창 동기화 역할).

- [ ] **Step 3: 검색창을 form으로 감싸고 onChange는 입력값만 갱신**

검색창 `<div>...</div>` 블록(주석 `{/* 검색창 */}` 아래)을 아래로 교체한다:

```tsx
      {/* 검색창 */}
      <form
        onSubmit={handleSearch}
        className="focus-within:border-primary flex flex-1 items-center gap-2 rounded-full border border-transparent bg-[#efefef] px-3.5 py-[7px] transition-all duration-150 focus-within:shadow-[0_0_0_3px_rgba(0,102,255,0.12)]">
        <Search size={15} className="shrink-0 text-[#767676]" />
        <input
          type="text"
          placeholder="검색"
          value={searchValue}
          onChange={event => setSearchValue(event.target.value)}
          className="w-full bg-transparent text-[13px] text-[#211922] outline-none placeholder:text-[#767676]"
        />
      </form>
```

변경점: 래퍼 `div`→`form` + `onSubmit={handleSearch}`, `onChange`는 `setSearchValue`만 호출(즉시 `router.replace` 제거). 스타일 클래스는 그대로 옮김.

- [ ] **Step 4: 개발 서버에서 수동 확인**

Run: `yarn dev` 후 브라우저에서 검색창에 제목 일부 입력 → 엔터
Expected: URL이 `/?query=...`로 바뀌고 결과가 필터링됨. 타이핑만 해서는 URL이 바뀌지 않음.

- [ ] **Step 5: Commit**

```bash
git add src/widgets/Header.tsx
git commit -m "feat: Header 검색을 엔터 실행 방식으로 변경"
```

---

### Task 4: E2E 테스트로 검색 시나리오 검증

**Files:**
- Create: `e2e/home-search.spec.ts`

스펙 6장 시나리오 중 데이터/컨텍스트에 안정적인 핵심 4건을 자동화한다. (비로그인 분기, 빈 DB는 환경 의존이 커서 수동 검증으로 남긴다 — 스펙 문서에 기록됨.) 테스트는 storageState(로그인 상태)를 재사용한다.

- [ ] **Step 1: E2E 테스트 파일 작성**

`e2e/home-search.spec.ts` 생성:

```ts
import { test, expect, type Page } from '@playwright/test';

// 첫 디자인 카드의 제목(이미지 alt)에서 검색어로 쓸 단어를 추출
async function firstDesignTitle(page: Page): Promise<string> {
  const firstCardImage = page.locator('a[href^="/designs/"] img').first();
  return (await firstCardImage.getAttribute('alt')) ?? '';
}

test('제목 검색 시 URL이 갱신되고 결과가 필터링된다', async ({ page }) => {
  await page.goto('/');
  const title = await firstDesignTitle(page);
  const keyword = title.slice(0, 2); // 제목 앞부분 일부

  const searchBox = page.getByPlaceholder('검색');
  await searchBox.fill(keyword);
  await searchBox.press('Enter');

  await expect(page).toHaveURL(/query=/);
  // 매칭된 카드가 최소 1개 이상 표시됨
  await expect(page.locator('a[href^="/designs/"]').first()).toBeVisible();
});

test('엔터 전에는 검색이 실행되지 않는다', async ({ page }) => {
  await page.goto('/');
  const searchBox = page.getByPlaceholder('검색');
  await searchBox.fill('robot');
  // 타이핑만으로는 URL이 바뀌지 않음
  await expect(page).toHaveURL('/');
});

test('쿼리 URL로 직접 진입하면 검색창에 값이 채워지고, 비우면 전체로 복귀한다', async ({ page }) => {
  await page.goto('/?query=robot');
  const searchBox = page.getByPlaceholder('검색');
  await expect(searchBox).toHaveValue('robot');

  await searchBox.fill('');
  await searchBox.press('Enter');
  await expect(page).toHaveURL('/');
});

test('매칭 결과가 없으면 빈 상태 메시지를 보여준다', async ({ page }) => {
  await page.goto('/');
  const searchBox = page.getByPlaceholder('검색');
  await searchBox.fill('존재하지않는검색어zzz999');
  await searchBox.press('Enter');

  await expect(page.getByText('검색 결과가 없어요')).toBeVisible();
});
```

- [ ] **Step 2: E2E 테스트 실행**

Run: `yarn test:e2e e2e/home-search.spec.ts`
Expected: 4개 테스트 모두 PASS. (webServer가 `yarn dev`를 자동 기동하고, setup이 로그인 상태를 주입한다.)

- [ ] **Step 3: 실패 시 디버깅**

`첫 카드 alt가 비어있음` 등으로 첫 번째 테스트가 불안정하면, DB에 디자인이 1건 이상 있는지 확인한다. 디자인이 0건인 환경에서는 첫 번째 테스트를 건너뛰고 나머지 3건(엔터 전 미실행 / URL 동기화 / 빈 상태)으로 검증한다.

- [ ] **Step 4: Playwright MCP로 비로그인·빈 상태 수동 검증**

자동화에서 제외한 시나리오를 Playwright MCP로 실제 확인한다. `yarn dev`가 떠 있는 상태에서:

1. **매칭 0건 빈 상태**: `browser_navigate`로 `http://localhost:3000/?query=존재하지않는검색어zzz999` 진입 → `browser_snapshot`으로 "검색 결과가 없어요" 메시지가 보이는지 확인.
2. **비로그인 검색**: `browser_navigate`로 홈 진입 후, 로그인 쿠키가 없는 상태(또는 시크릿 컨텍스트)에서 검색창에 제목 일부 입력 후 엔터 → 결과가 필터링되고 에러 없이 동작하는지 `browser_snapshot`으로 확인. (검색은 인증 분기가 없어야 한다.)

확인 결과를 사용자에게 스냅샷/요약으로 보고한다.

- [ ] **Step 5: Commit**

```bash
git add e2e/home-search.spec.ts
git commit -m "test: 홈 검색 E2E 시나리오 추가"
```

---

## Self-Review

**Spec coverage (스펙 6장 시나리오 대응):**
- 제목 검색으로 결과 좁히기 → Task 4 테스트 1 ✓
- 대소문자 무시 → Task 1의 `mode: 'insensitive'`로 구현 (E2E는 한글 데이터라 대소문자 검증 생략, 구현으로 보장) ✓
- 타이핑 중 미실행 → Task 4 테스트 2 ✓
- 검색어 비우면 복귀 → Task 4 테스트 3 ✓
- URL 직접 진입 동기화 → Task 4 테스트 3 ✓
- 매칭 0건 빈 상태 → Task 4 테스트 4 ✓
- 빈 DB / 비로그인 → Task 4 Step 4에서 Playwright MCP로 수동 검증

**Placeholder scan:** TBD/TODO 없음. 모든 코드 스텝에 실제 코드 포함.

**Type consistency:** `getDesigns(query?: string)` 시그니처가 Task 1 정의와 Task 2 호출(`getDesigns(query)`)에서 일치. `handleSearch(event: FormEvent)` 시그니처가 Task 3의 import·핸들러·`onSubmit` 사용처에서 일치. 검색창 식별자 `placeholder="검색"`이 구현(Header)과 E2E에서 일치.

**범위 준수:** 페이지네이션·필터·정렬·자동완성은 스펙 제외 항목대로 계획에 없음.
