# 디자인 가격/유무료 구분 제거

**날짜**: 2026-06-04

## Context

MVP 단계에서 디자인에 유료/무료 구분이 존재했지만 실제 결제는 이루어지지 않았다 (`purchase.actions.ts`의 `amount: 0` 고정). 가격 필드와 유무료 구분을 완전히 제거하고, instructions(설명서 PDF) 다운로드는 로그인한 모든 유저에게 허용한다.

**목표**: price 필드 제거, Purchase 모델 제거, 관련 UI/로직/테스트 전면 정리

---

## 변경 범위

### 1. DB 마이그레이션

**파일**: `prisma/schema.prisma`

- `Design` 모델에서 `price Int @default(0)` 필드 제거
- `Design` 모델에서 `purchases Purchase[]` 릴레이션 제거
- `User` 모델에서 `purchases Purchase[]` 릴레이션 제거
- `Purchase` 모델 전체 삭제

마이그레이션 실행: `npx prisma migrate dev --name remove-price-and-purchase`

---

### 2. design-create 피처

**삭제**:
- `src/features/design-create/ui/PriceField.tsx`

**수정**:
- `src/features/design-create/design-create.schema.ts`
  - `isFree: z.boolean()` 제거
  - `price: z.number().min(0)` 제거
  - 두 개의 `.refine()` (가격 > 0, instructions 필수) 제거
- `src/features/design-create/ui/DesignCreateForm.tsx`
  - `<PriceField />` import 및 렌더링 제거
  - defaultValues에서 `isFree: false, price: 0` 제거
- `src/features/design-create/design-create.actions.ts`
  - `CreateDesignItem` 타입에서 `price: number` 제거
  - `prisma.design.create` 데이터에서 `price` 제거
- `src/features/design-create/design-create.mutate.ts`
  - 서버 액션 호출 시 `price` 제거

---

### 3. design-edit 피처

**삭제**:
- `src/features/design-edit/ui/PriceField.tsx`

**수정**:
- `src/features/design-edit/design-edit.schema.ts`
  - `isFree`, `price` 필드 및 관련 refine 제거 (create 스키마와 동일 패턴)
- `src/features/design-edit/ui/DesignEditForm.tsx`
  - `<PriceField />` import 및 렌더링 제거
  - defaultValues에서 `isFree: design.price === 0, price: design.price` 제거
- `src/features/design-edit/design-edit.actions.ts`
  - `UpdateDesignItem` 타입에서 `price: number` 제거
  - `prisma.design.update` 데이터에서 `price` 제거
- `src/features/design-edit/design-edit.mutate.ts`
  - 서버 액션 호출 시 `price` 제거

---

### 4. design-purchase 피처 → design-download 피처로 대체

**삭제**:
- `src/features/design-purchase/` 디렉토리 전체

**신규 생성**:
- `src/features/design-download/design-download.actions.ts`
  - `getInstructionUrl(designId, index)` 함수 이동
  - 권한 체크 변경: `본인 OR 구매자` → `로그인 유저`
  - `getIsPurchased` 호출 제거

```typescript
// 변경 전
const isPurchased = await getIsPurchased(user.id, designId);
if (user.id !== design.authorId && !isPurchased) throw new Error('다운로드 권한이 없습니다.');

// 변경 후
if (!user) throw new Error('로그인이 필요합니다.');
```

---

### 5. 디자인 카드

**파일**: `src/entities/design/ui/DesignCard.tsx`

- `{design.price > 0 && <span>· ₩{design.price.toLocaleString()}</span>}` 제거

---

### 6. 디자인 상세 페이지

**파일**: `src/app/(main)/designs/[id]/page.tsx`

**ViewerState 단순화** (7가지 → 3가지):

```typescript
// 변경 전
type ViewerState =
  | 'guest_free' | 'guest_paid' | 'free' | 'unbought' | 'bought'
  | 'owner' | 'no_instructions' | 'guest_no_instructions';

// 변경 후
type ViewerState = 'owner' | 'viewer' | 'guest';
```

```typescript
// 변경 전
const isFree = design.price === 0;
if (!user) return hasInstructions ? (isFree ? 'guest_free' : 'guest_paid') : 'guest_no_instructions';
if (user.id === design.authorId) return 'owner';
if (isFree) return hasInstructions ? 'free' : 'no_instructions';
return isPurchased ? 'bought' : 'unbought';

// 변경 후
if (!user) return 'guest';
if (user.id === design.authorId) return 'owner';
return 'viewer';
```

instructions 존재 여부(`design.instructions.length > 0`)는 state가 아닌 렌더링 시점에 체크.

**제거되는 UI 요소**:
- 가격 표시 (`design.price !== 0` 조건부 블록)
- `<PurchaseButton />` 컴포넌트
- `isPurchased` 서버 조회
- `getIsPurchased` import

**다운로드 버튼**: `getInstructionUrl` import 경로를 `design-purchase` → `design-download`로 변경

---

### 7. 모킹 데이터

**파일**: `src/entities/design/design.mock.ts`

- mock 객체에서 `price` 필드 제거

---

### 8. 테스트

#### Vitest 단위 테스트

영향 받는 테스트 파일을 찾아 아래 케이스 제거/수정:
- `isFree`, `price` 관련 스키마 검증 테스트
- purchase 관련 액션 테스트

#### Playwright E2E 테스트

테스트 코드에서 제거:
- 가격 입력 단계
- Free 체크박스 조작
- 구매 버튼 관련 시나리오

#### E2E 시나리오 문서

**`docs/e2e/e2e-design-create.md`**:
- "유료 디자인 등록" 시나리오 삭제
- "유료 디자인에서 가격 미입력" 시나리오 삭제
- "유료 디자인에서 Instructions 미업로드" 시나리오 삭제
- "Free 전환 시 가격 오류 해소" 시나리오 삭제
- "무료 디자인 등록" → "디자인 등록"으로 리네임, Free 체크박스 단계 제거

**`docs/e2e/e2e-design-edit.md`**:
- "무료 디자인을 유료로 전환" 시나리오 삭제
- "유료 디자인을 무료로 전환" 시나리오 삭제
- "유료 전환 후 가격 미입력" 시나리오 삭제
- "유료 전환 후 설명서 미첨부" 시나리오 삭제
- "설명서 PDF 추가" 조건에서 "유료 디자인" 언급 제거

---

## 구현 순서 (권장)

1. DB 마이그레이션 → Prisma 타입 재생성
2. design-create 피처 (스키마 → 액션 → mutate → UI 순)
3. design-edit 피처 (동일 패턴)
4. design-purchase 삭제 + design-download 신규 생성
5. 디자인 카드 & 상세 페이지
6. 테스트 & E2E 시나리오 문서

---

## 검증

```bash
# 타입 체크
yarn tsc --noEmit

# 린트
yarn lint

# 단위 테스트
yarn test

# E2E 테스트
yarn playwright test
```

수동 확인:
- 디자인 생성 폼에 가격 필드 없음
- 디자인 수정 폼에 가격 필드 없음
- 비로그인 상태: 다운로드 버튼 없음 (또는 로그인 유도)
- 로그인 상태: instructions 있는 디자인에서 다운로드 버튼 표시
- 디자인 카드 hover 시 가격 표시 없음
