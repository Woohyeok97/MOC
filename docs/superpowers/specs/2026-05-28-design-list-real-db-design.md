# 디자인 목록 실 DB 연동 설계

## Context

홈 화면의 디자인 목록이 현재 `MOCK_DESIGNS` 하드코딩 데이터를 반환하고 있다. Supabase PostgreSQL DB와 Prisma가 이미 연결되어 있고, `getDesignById`, `getUserDesignList` 등 다른 함수들은 이미 실 DB를 사용 중이다. `getDesigns()`만 Mock 상태로 남아있다. 또한 `DesignCard`가 `design.authorId`(UUID 문자열)를 작성자로 표시하고 있어 실제 사용자 이름이 보이도록 수정이 필요하다.

## 변경 범위

### 1. `src/entities/design/design.api.ts` — `getDesigns()` 교체

- `MOCK_DESIGNS.slice(0, 6)` → `prisma.design.findMany({ orderBy: { createdAt: 'desc' }, include: { author: true } })`
- `getUserDesignList`와 동일하게 thumbnail을 Supabase Storage 공개 URL로 변환
- `cache()` 래퍼 추가 (기존 다른 함수들과 패턴 일치)
- 반환 타입: `DesignWithAuthor[]` (이미 `design.type.ts`에 정의됨)
- `MOCK_DESIGNS` import 제거 (더 이상 사용 안 함)

### 2. `src/entities/design/ui/DesignCard.tsx` — 작성자 표시 수정

- props 타입: `Design` → `DesignWithAuthor`
- 작성자 표시: `design.authorId` → `design.author.name ?? design.authorId` (name null 폴백)

### 3. `src/app/(main)/(with-sidebar)/page.tsx` — 검색 필터 수정

- 검색 대상: `design.authorId` → `design.author.name ?? ''`

## 재사용할 기존 코드

- `DesignWithAuthor` 타입: `src/entities/design/design.type.ts:5`
- `getPublicImageUrl()`: `src/shared/api/supabase/storage.ts`
- `createClient()`: `src/shared/api/supabase/server.ts`
- `prisma`: `src/shared/api/prisma.ts`
- 패턴 참고: `getUserDesignList` (`design.api.ts:44–56`)

## 검증

### 사전 준비

`yarn dev`로 개발 서버 실행 후 Playwright MCP로 검증.

### Playwright MCP 검증 시나리오

**1. 디자인 목록 실 DB 데이터 표시 확인**
- `http://localhost:3000` 접속
- 스냅샷 촬영 후 디자인 카드가 1개 이상 렌더링되는지 확인
- 카드의 thumbnail 이미지 src가 Supabase Storage URL(`https://...supabase.co/storage/...`) 형식인지 확인

**2. 작성자 이름 표시 확인**
- 디자인 카드에 마우스 호버 (`browser_hover`)
- 스냅샷 촬영 후 호버 오버레이에 UUID 형식(`xxxxxxxx-xxxx-...`)이 아닌 사람 이름이 표시되는지 확인

**3. 작성자 이름 기준 검색 필터링 확인**
- 검색창에 실제 작성자 이름의 일부 입력 (`browser_type`)
- 스냅샷 촬영 후 해당 작성자의 디자인만 필터링되어 표시되는지 확인
- 존재하지 않는 이름 검색 시 "검색 결과가 없어요" 메시지가 표시되는지 확인
