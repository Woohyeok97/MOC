# Design List Real DB Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 화면 디자인 목록을 Mock 데이터 대신 실제 Supabase DB에서 가져오고, 작성자 표시를 UUID에서 실제 이름으로 변경한다.

**Architecture:** `getDesigns()`가 `prisma.design.findMany({ include: { author: true } })`로 DB에서 가져오고, Supabase Storage path인 thumbnail을 공개 URL로 변환한 뒤 반환한다. `DesignCard`는 `DesignWithAuthor` 타입을 받아 `author.name`을 표시하고, 홈 페이지 검색도 이름 기준으로 동작한다.

**Tech Stack:** Next.js App Router, Prisma ORM, Supabase PostgreSQL, Supabase Storage, React cache

---

## File Map

- Modify: `src/entities/design/design.api.ts` — `getDesigns()` 함수 교체
- Modify: `src/entities/design/ui/DesignCard.tsx` — 타입 및 작성자 표시 수정
- Modify: `src/app/(main)/(with-sidebar)/page.tsx` — 검색 필터 수정

---

### Task 1: `getDesigns()` 실 DB 연동

**Files:**
- Modify: `src/entities/design/design.api.ts`

현재 `getDesigns()`는 `MOCK_DESIGNS.slice(0, 6)`를 반환한다. 이를 Prisma 쿼리로 교체하고, thumbnail을 Storage 공개 URL로 변환한다. `getUserDesignList` 패턴을 따르되 `include: { author: true }` 추가.

- [ ] **Step 1: `getDesigns()` 교체**

`src/entities/design/design.api.ts`의 1~14번 줄을 아래로 교체한다. `MOCK_DESIGNS` import는 삭제한다.

```typescript
import { cache } from 'react';
import { prisma } from '@/shared/api/prisma';
import { createClient } from '@/shared/api/supabase/server';
import { getPublicImageUrl } from '@/shared/api/supabase/storage';
import type { Design, DesignWithAuthor } from '@/entities/design/design.type';

export const getDesigns = cache(async (): Promise<DesignWithAuthor[]> => {
  const designs = await prisma.design.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: true },
  });

  // thumbnail은 스토리지 path로 저장되어 있어 공개 URL로 변환
  const supabase = await createClient();
  return designs.map(design => ({
    ...design,
    thumbnail: getPublicImageUrl(supabase, design.thumbnail),
  }));
});
```

나머지 함수들(`getDesignById`, `getIsPurchased`, `getDesignByIdRaw`, `getUserDesignList`)은 그대로 유지한다.

- [ ] **Step 2: 타입 에러 없는지 확인**

```bash
yarn tsc --noEmit
```

에러 없이 완료되어야 한다.

- [ ] **Step 3: 커밋**

```bash
git add src/entities/design/design.api.ts
git commit -m "feat: getDesigns()를 실 DB 쿼리로 교체, author 포함"
```

---

### Task 2: `DesignCard` 작성자 이름 표시

**Files:**
- Modify: `src/entities/design/ui/DesignCard.tsx`

현재 `Design` 타입을 받아 `design.authorId`를 표시하고 있다. `DesignWithAuthor` 타입으로 변경하고 `author.name`을 표시한다.

- [ ] **Step 1: 타입 및 표시 수정**

`src/entities/design/ui/DesignCard.tsx` 전체를 아래로 교체한다.

```typescript
import Image from 'next/image';
import Link from 'next/link';
import type { DesignWithAuthor } from '@/entities/design/design.type';

export function DesignCard({ design }: { design: DesignWithAuthor }) {
  const thumbnailUrl = design.thumbnail || null;

  return (
    <Link
      href={`/designs/${design.id}`}
      className="group mb-2.5 block cursor-pointer break-inside-avoid transition-transform duration-170 ease-out hover:-translate-y-0.5">
      <div className="relative overflow-hidden rounded-[14px] bg-[#efefef]">
        {thumbnailUrl && (
          <Image
            src={thumbnailUrl}
            alt={design.title}
            width={600}
            height={800}
            className="h-auto w-full object-cover transition-[transform,filter] duration-700 group-hover:scale-[1.04] group-hover:brightness-[0.62]"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        )}

        {/* hover 오버레이 — 기본 숨김, hover 시 fade in */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-180 group-hover:opacity-100">
          {/* 카테고리 배지 */}
          <span className="bg-primary absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.2px] text-white shadow-[0_2px_6px_rgba(0,102,255,0.35)]">
            {design.category}
          </span>

          {/* 하단 제목 + 작성자 */}
          <div className="absolute inset-x-0 bottom-0 px-3 pt-3.5 pb-3">
            <p className="line-clamp-2 text-[13px] leading-[1.3] font-bold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]">
              {design.title}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="inline-block h-4 w-4 shrink-0 rounded-full bg-[#e0e0d9]" />
              <span className="text-[11px] text-white/85">
                {design.author.name ?? design.authorId}
              </span>
              {design.price > 0 && (
                <span className="text-[11px] text-white/60">· ₩{design.price.toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: 타입 에러 없는지 확인**

```bash
yarn tsc --noEmit
```

에러 없이 완료되어야 한다.

- [ ] **Step 3: 커밋**

```bash
git add src/entities/design/ui/DesignCard.tsx
git commit -m "feat: DesignCard 작성자 표시를 authorId에서 author.name으로 변경"
```

---

### Task 3: 홈 페이지 검색 필터 수정

**Files:**
- Modify: `src/app/(main)/(with-sidebar)/page.tsx`

검색 필터가 `design.authorId`를 기준으로 하고 있다. `design.author.name`으로 변경한다.

- [ ] **Step 1: 검색 필터 수정**

`src/app/(main)/(with-sidebar)/page.tsx`의 `filteredDesigns` 부분을 아래로 교체한다.

```typescript
import { DesignCard } from '@/entities/design/ui/DesignCard';
import { getDesigns } from '@/entities/design/design.api';

type SearchParams = Promise<{ query?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const { query } = await searchParams;
  const designs = await getDesigns(); // 디자인 리스트 요청

  // 목록으로 보여줄 디자인 리스트 → 검색어가 있으면 제목·작성자 이름 기준으로 걸러낸 목록, 없으면 전체 목록
  const filteredDesigns = query
    ? designs.filter(
        design =>
          design.title.toLowerCase().includes(query.toLowerCase()) ||
          (design.author.name ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : designs;

  return (
    <div className="columns-[200px] gap-[10px] p-4">
      {filteredDesigns.map(design => (
        <DesignCard key={design.id} design={design} />
      ))}

      {/* 검색 결과가 없을 때 */}
      {filteredDesigns.length === 0 && (
        <p className="py-20 text-center text-[14px] text-[#91918c]">검색 결과가 없어요</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 에러 없는지 확인**

```bash
yarn tsc --noEmit
```

에러 없이 완료되어야 한다.

- [ ] **Step 3: 커밋**

```bash
git add src/app/(main)/(with-sidebar)/page.tsx
git commit -m "feat: 홈 페이지 검색 필터를 authorId에서 author.name 기준으로 변경"
```

---

### Task 4: Playwright MCP 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 개발 서버 실행**

```bash
yarn dev
```

`localhost:3000`에서 서버가 실행되어야 한다.

- [ ] **Step 2: 홈 화면 디자인 카드 표시 확인**

Playwright MCP로 `http://localhost:3000` 접속 후 스냅샷 촬영.

확인 항목:
- 디자인 카드가 1개 이상 렌더링됨
- 카드 thumbnail의 `src` 속성이 `https://...supabase.co/storage/...` 형식임

- [ ] **Step 3: 작성자 이름 호버 확인**

Playwright MCP로 첫 번째 디자인 카드에 `browser_hover` 후 스냅샷 촬영.

확인 항목:
- 호버 오버레이에 UUID 형식(`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)이 아닌 사람 이름이 표시됨

- [ ] **Step 4: 작성자 이름 기준 검색 확인**

Playwright MCP로 검색창에 실제 작성자 이름의 일부를 `browser_type`으로 입력 후 스냅샷 촬영.

확인 항목:
- 해당 작성자의 디자인만 필터링되어 표시됨
- 존재하지 않는 이름 검색 시 "검색 결과가 없어요" 텍스트가 표시됨
