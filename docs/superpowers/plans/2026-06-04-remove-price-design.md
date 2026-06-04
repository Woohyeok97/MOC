# 디자인 가격/유무료 구분 제거 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 디자인의 `price` 필드와 유료/무료 구분을 완전 제거하고, instructions 다운로드를 로그인한 모든 유저에게 허용한다.

**Architecture:** DB에서 `price` 필드와 `Purchase` 모델을 제거하고, `design-purchase` 피처를 삭제한 뒤 `design-download` 피처로 대체한다. 상세 페이지 ViewerState를 7가지에서 3가지(`owner | viewer | guest`)로 단순화한다.

**Tech Stack:** Next.js 15 App Router, Prisma ORM (PostgreSQL), Zod, React Hook Form, TanStack Query, Playwright

---

## 변경 파일 맵

| 작업 | 파일 |
|------|------|
| **수정** | `prisma/schema.prisma` |
| **수정** | `src/features/design-create/design-create.schema.ts` |
| **수정** | `src/features/design-create/design-create.actions.ts` |
| **수정** | `src/features/design-create/design-create.mutate.ts` |
| **삭제** | `src/features/design-create/ui/PriceField.tsx` |
| **수정** | `src/features/design-create/ui/DesignCreateForm.tsx` |
| **수정** | `src/features/design-edit/design-edit.schema.ts` |
| **수정** | `src/features/design-edit/design-edit.actions.ts` |
| **수정** | `src/features/design-edit/design-edit.mutate.ts` |
| **삭제** | `src/features/design-edit/ui/PriceField.tsx` |
| **수정** | `src/features/design-edit/ui/DesignEditForm.tsx` |
| **신규** | `src/features/design-download/design-download.actions.ts` |
| **신규** | `src/features/design-download/design-download.mutate.ts` |
| **신규** | `src/features/design-download/ui/InstructionDownloadButton.tsx` |
| **삭제** | `src/features/design-purchase/` (디렉토리 전체) |
| **수정** | `src/entities/design/design.api.ts` |
| **수정** | `src/entities/design/ui/DesignCard.tsx` |
| **수정** | `src/app/(main)/designs/[id]/page.tsx` |
| **수정** | `docs/e2e/e2e-design-create.md` |
| **수정** | `docs/e2e/e2e-design-edit.md` |
| **수정** | `e2e/design-create.spec.ts` |
| **수정** | `e2e/design-edit.spec.ts` |

---

## Task 1: DB 마이그레이션

**Files:**
- Modify: `prisma/schema.prisma`

### 배경

현재 `Design` 모델에 `price Int @default(0)` 필드와 `purchases Purchase[]` 릴레이션이 있고, `Purchase` 모델이 존재한다. `User` 모델에도 `purchases Purchase[]` 릴레이션이 있다. 이 모든 것을 제거한다.

- [ ] **Step 1: schema.prisma 수정**

`prisma/schema.prisma`를 아래 내용으로 교체한다 (변경점: `User.purchases`, `Design.price`, `Design.purchases`, `Purchase` 모델 제거):

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum DesignCategory {
  architecture
  castles
  vehicles
  robots
  others
}

model User {
  id        String  @id      /// Supabase Auth의 user.id와 동일한 값
  name      String?          /// 구글 프로필에서 가져온 표시 이름
  avatarUrl String?          /// 프로필 이미지 URL (초기값: 구글 계정 아바타)

  designs   Design[]
}

model Design {
  id               String         @id @default(uuid()) @db.Uuid
  title            String
  description      String
  category         DesignCategory
  instructions     String[]
  instructionNames String[]       @default([])
  thumbnail        String
  images           String[]
  authorId         String
  author           User           @relation(fields: [authorId], references: [id])
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
}
```

- [ ] **Step 2: 마이그레이션 실행**

```bash
npx prisma migrate dev --name remove-price-and-purchase
```

프롬프트에서 "yes"로 확인. 성공하면 `prisma/migrations/` 아래 새 마이그레이션 폴더가 생긴다.

- [ ] **Step 3: Prisma 클라이언트 재생성 확인**

```bash
npx prisma generate
```

`src/generated/prisma/` 안의 타입에서 `price`, `Purchase` 관련 내용이 사라졌는지 확인. 이후 타입스크립트 컴파일 에러가 발생하는 것이 정상이다 — 이후 태스크에서 순차적으로 수정한다.

- [ ] **Step 4: 커밋**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: DB에서 price 필드와 Purchase 모델 제거"
```

---

## Task 2: design-create — 스키마 · 액션 · mutate

**Files:**
- Modify: `src/features/design-create/design-create.schema.ts`
- Modify: `src/features/design-create/design-create.actions.ts`
- Modify: `src/features/design-create/design-create.mutate.ts`

### 배경

`design-create.schema.ts`에는 `isFree: z.boolean()`, `price: z.number().min(0)` 필드와 유료일 때 검증하는 `.refine()` 두 개가 있다. 이 세 가지를 제거하면 `DesignCreateFormType`에서도 `isFree`, `price`가 사라진다.

`design-create.actions.ts`의 `CreateDesignItem` 타입과 `prisma.design.create` 호출에서 `price` 필드를 제거한다.

`design-create.mutate.ts`의 `createDesign()` 호출에서 `price: data.price` 줄을 제거한다.

- [ ] **Step 1: design-create.schema.ts 수정**

`src/features/design-create/design-create.schema.ts`를 아래 내용으로 교체:

```typescript
import { z } from 'zod';

// 디자인 카테고리
export const DESIGN_CATEGORIES = ['architecture', 'castles', 'vehicles', 'robots', 'others'] as const;

// 디자인 생성 스키마
export const DesignCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(120, 'Max 120 characters.'),
  description: z.string().trim().min(1, 'Description is required.').max(2000, 'Max 2000 characters.'),
  category: z.enum(DESIGN_CATEGORIES, { error: () => 'Please select a category.' }),

  thumbnail: z
    .custom<File>(file => file instanceof File, 'Thumbnail is required.')
    .refine(file => file.type.startsWith('image/'), 'Only image files are allowed.')
    .refine(file => file.size <= 10 * 1024 * 1024, 'Max file size is 10MB.'),

  images: z
    .array(
      z
        .custom<File>(file => file instanceof File)
        .refine(file => file.type.startsWith('image/'), 'Only image files are allowed.')
        .refine(file => file.size <= 10 * 1024 * 1024, 'Max file size is 10MB.')
    )
    .max(6, 'Up to 6 gallery images allowed.'),

  instructions: z
    .array(
      z
        .custom<File>(file => file instanceof File)
        .refine(file => file.type === 'application/pdf', 'Only PDF files are allowed.')
    )
    .max(2, 'Up to 2 PDF files allowed.')
});

// 디자인 등록 폼 타입
export type DesignCreateFormType = z.infer<typeof DesignCreateSchema>;
```

- [ ] **Step 2: design-create.actions.ts 수정**

`src/features/design-create/design-create.actions.ts`를 아래 내용으로 교체:

```typescript
'use server';

import { prisma } from '@/shared/api/prisma';
import { getAuthSession } from '@/features/auth/auth.api';
import type { DesignCategory } from '@/entities/design/design.type';

// DB 업로드용 디자인 타입
type CreateDesignItem = {
  id: string;
  title: string;
  description: string;
  category: DesignCategory;
  thumbnailPath: string;
  imagePaths: string[];
  instructionPaths: string[];
  instructionNames: string[];
};

// 디자인 등록 서버 액션 — 파일 업로드는 클라이언트에서 처리 후 path만 전달받음
export async function createDesign(input: CreateDesignItem): Promise<{ designId: string }> {
  // 로그인 확인
  const user = await getAuthSession();
  if (!user) throw new Error('로그인이 필요합니다.');

  // 디자인 생성 -> DB 업로드
  const design = await prisma.design.create({
    data: {
      id: input.id,
      title: input.title,
      description: input.description,
      category: input.category,
      thumbnail: input.thumbnailPath,
      images: input.imagePaths,
      instructions: input.instructionPaths,
      instructionNames: input.instructionNames,
      authorId: user.id
    }
  });

  return { designId: design.id };
}
```

- [ ] **Step 3: design-create.mutate.ts 수정**

`src/features/design-create/design-create.mutate.ts` 안의 `createDesign()` 호출에서 `price: data.price,` 줄을 제거한다:

```typescript
// 변경 전
return await createDesign({
  id: designId,
  title: data.title,
  description: data.description,
  category: data.category,
  price: data.price,         // 이 줄 삭제
  thumbnailPath: uploadedThumbnail.path,
  imagePaths: uploadedGallery.map(img => img.path),
  instructionPaths: uploadedInstructions.map(instruction => instruction.path),
  instructionNames: uploadedInstructions.map(instruction => instruction.name)
});

// 변경 후
return await createDesign({
  id: designId,
  title: data.title,
  description: data.description,
  category: data.category,
  thumbnailPath: uploadedThumbnail.path,
  imagePaths: uploadedGallery.map(img => img.path),
  instructionPaths: uploadedInstructions.map(instruction => instruction.path),
  instructionNames: uploadedInstructions.map(instruction => instruction.name)
});
```

- [ ] **Step 4: 타입 체크**

```bash
yarn tsc --noEmit 2>&1 | grep "design-create"
```

design-create 관련 에러가 없어야 한다. (다른 파일 에러는 이후 태스크에서 수정)

- [ ] **Step 5: 커밋**

```bash
git add src/features/design-create/design-create.schema.ts \
        src/features/design-create/design-create.actions.ts \
        src/features/design-create/design-create.mutate.ts
git commit -m "feat: design-create에서 price/isFree 필드 제거"
```

---

## Task 3: design-create UI — PriceField 삭제 · DesignCreateForm 수정

**Files:**
- Delete: `src/features/design-create/ui/PriceField.tsx`
- Modify: `src/features/design-create/ui/DesignCreateForm.tsx`

- [ ] **Step 1: PriceField.tsx 삭제**

```bash
rm src/features/design-create/ui/PriceField.tsx
```

- [ ] **Step 2: DesignCreateForm.tsx 수정**

아래 3곳을 수정한다:

**① import 제거** (8번째 줄 근처):
```typescript
// 제거
import { PriceField } from './PriceField';
```

**② defaultValues에서 isFree, price 제거** (24~29번째 줄):
```typescript
// 변경 전
defaultValues: {
  title: '',
  description: '',
  isFree: false,
  price: 0,
  category: undefined,
  images: [],
  instructions: []
}

// 변경 후
defaultValues: {
  title: '',
  description: '',
  category: undefined,
  images: [],
  instructions: []
}
```

**③ Price 섹션 전체 제거** (JSX 안, "가격" 주석이 있는 FormSection):
```tsx
// 제거 대상 (DesignCreateForm.tsx 약 93~96번째 줄)
{/* 가격 */}
<FormSection title="Price" desc="Download price">
  <PriceField />
</FormSection>
```

- [ ] **Step 3: 타입 체크**

```bash
yarn tsc --noEmit 2>&1 | grep "design-create"
```

에러 없음 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/features/design-create/ui/
git commit -m "feat: design-create 폼에서 PriceField 제거"
```

---

## Task 4: design-edit — 스키마 · 액션 · mutate

**Files:**
- Modify: `src/features/design-edit/design-edit.schema.ts`
- Modify: `src/features/design-edit/design-edit.actions.ts`
- Modify: `src/features/design-edit/design-edit.mutate.ts`

### 배경

design-create Task 2와 동일한 패턴. `design-edit.schema.ts`의 `baseSchema`에서 `isFree`, `price` 제거 + 두 개 `.refine()` 제거. `design-edit.actions.ts`의 `UpdateDesignItem` 타입에서 `price` 제거 + `prisma.design.update` 호출에서 `price` 제거. `design-edit.mutate.ts`의 `updateDesign()` 호출에서 `price: data.price` 제거.

- [ ] **Step 1: design-edit.schema.ts 수정**

`src/features/design-edit/design-edit.schema.ts`를 아래 내용으로 교체:

```typescript
import { z } from 'zod';

export const DESIGN_CATEGORIES = ['architecture', 'castles', 'vehicles', 'robots', 'others'] as const;

// 디자인 수정 스키마 — 파일 필드는 File(신규) | string(기존 path) 유니온
export const DesignEditSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(120, 'Max 120 characters.'),
  description: z.string().trim().min(1, 'Description is required.').max(2000, 'Max 2000 characters.'),
  category: z.enum(DESIGN_CATEGORIES, { error: () => 'Please select a category.' }),

  thumbnail: z.union([
    z
      .custom<File>(file => file instanceof File, 'Thumbnail is required.')
      .refine(file => file.type.startsWith('image/'), 'Only image files are allowed.')
      .refine(file => file.size <= 10 * 1024 * 1024, 'Max file size is 10MB.'),
    z.string().min(1, 'Thumbnail is required.')
  ]),

  images: z
    .array(
      z.union([
        z
          .custom<File>(file => file instanceof File)
          .refine(file => file.type.startsWith('image/'), 'Only image files are allowed.')
          .refine(file => file.size <= 10 * 1024 * 1024, 'Max file size is 10MB.'),
        z.string().min(1)
      ])
    )
    .max(6, 'Up to 6 gallery images allowed.'),

  instructions: z
    .array(
      z.union([
        z
          .custom<File>(file => file instanceof File)
          .refine(file => file.type === 'application/pdf', 'Only PDF files are allowed.'),
        z.string().min(1)
      ])
    )
    .max(2, 'Up to 2 PDF files allowed.')
});

// 디자인 수정 폼 타입
export type DesignEditFormType = z.infer<typeof DesignEditSchema>;
```

- [ ] **Step 2: design-edit.actions.ts 수정**

`src/features/design-edit/design-edit.actions.ts`에서 `UpdateDesignItem` 타입과 `prisma.design.update` 호출을 수정한다:

```typescript
// 변경 전
type UpdateDesignItem = {
  designId: string;
  title: string;
  description: string;
  category: DesignCategory;
  price: number;           // 이 줄 삭제
  thumbnailPath: string;
  imagePaths: string[];
  instructionPaths: string[];
  instructionNames: string[];
};
```

```typescript
// 변경 후
type UpdateDesignItem = {
  designId: string;
  title: string;
  description: string;
  category: DesignCategory;
  thumbnailPath: string;
  imagePaths: string[];
  instructionPaths: string[];
  instructionNames: string[];
};
```

`prisma.design.update` 호출에서도 `price: input.price,` 줄을 제거한다:

```typescript
// 변경 전
data: {
  title: input.title,
  description: input.description,
  category: input.category,
  price: input.price,      // 이 줄 삭제
  thumbnail: input.thumbnailPath,
  ...
}

// 변경 후
data: {
  title: input.title,
  description: input.description,
  category: input.category,
  thumbnail: input.thumbnailPath,
  ...
}
```

- [ ] **Step 3: design-edit.mutate.ts 수정**

`updateDesign()` 호출에서 `price: data.price,` 줄 제거:

```typescript
// 변경 전
result = await updateDesign({
  designId,
  title: data.title,
  description: data.description,
  category: data.category,
  price: data.price,         // 이 줄 삭제
  thumbnailPath: finalThumbnailPath,
  ...
});

// 변경 후
result = await updateDesign({
  designId,
  title: data.title,
  description: data.description,
  category: data.category,
  thumbnailPath: finalThumbnailPath,
  ...
});
```

- [ ] **Step 4: 타입 체크**

```bash
yarn tsc --noEmit 2>&1 | grep "design-edit"
```

에러 없음 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/features/design-edit/design-edit.schema.ts \
        src/features/design-edit/design-edit.actions.ts \
        src/features/design-edit/design-edit.mutate.ts
git commit -m "feat: design-edit에서 price/isFree 필드 제거"
```

---

## Task 5: design-edit UI — PriceField 삭제 · DesignEditForm 수정

**Files:**
- Delete: `src/features/design-edit/ui/PriceField.tsx`
- Modify: `src/features/design-edit/ui/DesignEditForm.tsx`

- [ ] **Step 1: PriceField.tsx 삭제**

```bash
rm src/features/design-edit/ui/PriceField.tsx
```

- [ ] **Step 2: DesignEditForm.tsx 수정**

아래 3곳을 수정한다:

**① import 제거**:
```typescript
// 제거
import { PriceField } from './PriceField';
```

**② defaultValues에서 isFree, price 제거**:
```typescript
// 변경 전
defaultValues: {
  title: design.title,
  description: design.description,
  isFree: design.price === 0,
  price: design.price,
  category: design.category as DesignEditFormType['category'],
  thumbnail: design.thumbnail,
  images: design.images,
  instructions: design.instructions
}

// 변경 후
defaultValues: {
  title: design.title,
  description: design.description,
  category: design.category as DesignEditFormType['category'],
  thumbnail: design.thumbnail,
  images: design.images,
  instructions: design.instructions
}
```

**③ Price 섹션 전체 제거** (JSX 안):
```tsx
// 제거 대상
{/* 가격 */}
<FormSection title="Price" desc="Download price">
  <PriceField />
</FormSection>
```

- [ ] **Step 3: 타입 체크**

```bash
yarn tsc --noEmit 2>&1 | grep "design-edit"
```

에러 없음 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/features/design-edit/ui/
git commit -m "feat: design-edit 폼에서 PriceField 제거"
```

---

## Task 6: design-download 피처 신규 생성

**Files:**
- Create: `src/features/design-download/design-download.actions.ts`
- Create: `src/features/design-download/design-download.mutate.ts`
- Create: `src/features/design-download/ui/InstructionDownloadButton.tsx`

### 배경

`design-purchase/purchase.actions.ts`의 `getInstructionUrl` 함수를 이동하되, 권한 체크를 변경한다.

- **변경 전**: 본인(`authorId`) 또는 구매자(`getIsPurchased`) 확인
- **변경 후**: 로그인 여부만 확인 (로그인하면 누구나 다운로드 가능)

`InstructionDownloadButton`도 `design-purchase`에서 `design-download`로 이동하고, import 경로만 업데이트한다.

- [ ] **Step 1: design-download.actions.ts 생성**

`src/features/design-download/design-download.actions.ts` 파일 생성:

```typescript
'use server';

import { getAuthSession } from '@/features/auth/auth.api';
import { getDesignById } from '@/entities/design/design.api';
import { createServiceRoleClient } from '@/shared/api/supabase/server';

export async function getInstructionUrl(designId: string, index: number): Promise<string> {
  // 1. 로그인 + 디자인 조회 병렬 실행
  const [user, design] = await Promise.all([getAuthSession(), getDesignById(designId)]);
  if (!user) throw new Error('로그인이 필요합니다.');
  if (!design) throw new Error('존재하지 않는 디자인입니다.');

  // 2. 인덱스 유효성 확인
  const path = design.instructions[index];
  if (!path) throw new Error('존재하지 않는 파일입니다.');

  // 3. signed URL 생성 — 60초 유효, 다운로드 시 원본 파일명으로 저장
  const downloadName = design.instructionNames[index] || `Instruction_${index + 1}.pdf`;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage.from('Instructions').createSignedUrl(path, 60, {
    download: downloadName
  });
  if (error || !data) throw new Error(`서명 URL 생성 실패: ${error?.message}`);
  return data.signedUrl;
}
```

- [ ] **Step 2: design-download.mutate.ts 생성**

`src/features/design-download/design-download.mutate.ts` 파일 생성:

```typescript
'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { getInstructionUrl } from './design-download.actions';

type GetInstructionMutationOptions = UseMutationOptions<string, Error, { designId: string; index: number }>;

export function useGetInstructionMutation(options?: GetInstructionMutationOptions) {
  return useMutation<string, Error, { designId: string; index: number }>({
    mutationFn: ({ designId, index }) => getInstructionUrl(designId, index),
    ...options
  });
}
```

- [ ] **Step 3: ui 디렉토리 생성 + InstructionDownloadButton.tsx 이동**

```bash
mkdir -p src/features/design-download/ui
```

`src/features/design-download/ui/InstructionDownloadButton.tsx` 파일 생성 (기존 `design-purchase/ui/InstructionDownloadButton.tsx`에서 import 경로만 변경):

```typescript
'use client';

import { Download, LockKeyhole } from 'lucide-react';
import { useGetInstructionMutation } from '@/features/design-download/design-download.mutate';

interface InstructionDownloadButtonProps {
  designId: string;
  index: number;
  label: string;
  isEnabled: boolean;
}

export function InstructionDownloadButton({ designId, index, label, isEnabled }: InstructionDownloadButtonProps) {
  const { mutate, isPending } = useGetInstructionMutation({
    onSuccess: url => {
      window.open(url, '_blank');
    }
  });

  const handleDownloadInstruction = () => {
    if (!isEnabled) return;
    mutate({ designId, index });
  };

  return (
    <div className="bg-muted border-input flex items-center justify-between rounded-xl border px-3 py-2">
      <div className="flex items-center gap-3">
        <div
          className={`${isEnabled ? 'bg-primary' : 'bg-[#91918c]'} flex h-8 w-8 items-center justify-center rounded-lg`}>
          <span className="text-[8px] font-extrabold text-white">PDF</span>
        </div>
        <div>
          <p className="text-[12.5px] font-semibold">{label}</p>
          <p className="text-muted-foreground text-[11px]">12.3 MB</p>
        </div>
      </div>
      <button
        onClick={handleDownloadInstruction}
        disabled={isPending || !isEnabled}
        className="bg-secondary flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg">
        {isEnabled ? <Download size={16} /> : <LockKeyhole size={16} />}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: 타입 체크**

```bash
yarn tsc --noEmit 2>&1 | grep "design-download"
```

에러 없음 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/features/design-download/
git commit -m "feat: design-download 피처 생성 (getInstructionUrl 이동 및 권한 단순화)"
```

---

## Task 7: design-purchase 삭제 · design.api.ts 정리 · DesignCard 수정

**Files:**
- Delete: `src/features/design-purchase/` (디렉토리 전체)
- Modify: `src/entities/design/design.api.ts`
- Modify: `src/entities/design/ui/DesignCard.tsx`

- [ ] **Step 1: design-purchase 디렉토리 삭제**

```bash
rm -rf src/features/design-purchase/
```

- [ ] **Step 2: design.api.ts에서 getIsPurchased 제거**

`src/entities/design/design.api.ts`에서 `getIsPurchased` 함수 전체를 삭제한다:

```typescript
// 삭제 대상 (42~44번째 줄)
// TODO: DB 연결 후 prisma.purchase.findUnique({ where: { userId_designId: { userId, designId } } })로 교체
export async function getIsPurchased(_userId: string, _designId: string): Promise<boolean> {
  return false;
}
```

- [ ] **Step 3: DesignCard.tsx에서 가격 표시 제거**

`src/entities/design/ui/DesignCard.tsx`에서 아래 블록을 삭제한다:

```typescript
// 삭제 대상 (41~43번째 줄)
{design.price > 0 && (
  <span className="text-[11px] text-white/60">· ₩{design.price.toLocaleString()}</span>
)}
```

- [ ] **Step 4: 타입 체크**

```bash
yarn tsc --noEmit 2>&1 | grep -E "design-purchase|design.api|DesignCard"
```

에러 없음 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/features/design-purchase/ \
        src/entities/design/design.api.ts \
        src/entities/design/ui/DesignCard.tsx
git commit -m "feat: design-purchase 피처 삭제, getIsPurchased 제거, 카드 가격 표시 제거"
```

---

## Task 8: 상세 페이지 ViewerState 단순화

**Files:**
- Modify: `src/app/(main)/designs/[id]/page.tsx`

### 배경

현재 7가지 ViewerState를 3가지(`owner | viewer | guest`)로 단순화한다.

- `guest`: 비로그인 → instructions 다운로드 불가
- `viewer`: 로그인 + 작성자 아님 → 다운로드 가능
- `owner`: 작성자 → 다운로드 가능 + 수정 버튼

제거 대상:
- `isPurchased` 서버 조회
- `design.price !== 0` 가격 표시 블록
- `PurchaseButton` import 및 사용
- `guest_paid`, `guest_free`, `free`, `unbought`, `bought`, `no_instructions`, `guest_no_instructions` 상태
- `getIsPurchased` import

`InstructionDownloadButton` import 경로를 `design-purchase` → `design-download`로 변경.
`isEnabled` 조건: `viewerState !== 'guest'`.

`guest` 상태에서의 버튼은 "로그인하고 다운로드하기"로 통일.

- [ ] **Step 1: page.tsx 전체 교체**

`src/app/(main)/designs/[id]/page.tsx`를 아래 내용으로 교체:

```typescript
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LogIn, Share2, Bookmark, PencilLine } from 'lucide-react';
import { getDesignById } from '@/entities/design/design.api';
import { getAuthSession } from '@/features/auth/auth.api';
// components
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DesignImageCarousel } from '@/entities/design/ui/DesignImageCarousel';
import { InstructionDownloadButton } from '@/features/design-download/ui/InstructionDownloadButton';

type ViewerState = 'owner' | 'viewer' | 'guest';

export default async function DesignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: designId } = await params;
  const [design, user] = await Promise.all([getDesignById(designId), getAuthSession()]);

  if (!design) notFound();

  const viewerState: ViewerState = (() => {
    if (!user) return 'guest';
    if (user.id === design.authorId) return 'owner';
    return 'viewer';
  })();

  // 캐러셀에 넣을 이미지 배열: thumbnail 첫 번째, 이후 gallery
  const carouselImages = [design.thumbnail, ...design.images].filter(Boolean);

  return (
    <main className="detail-page-pad max-w-7xl px-8 pt-4 pb-20" style={{ margin: '14px auto 0' }}>
      <div className="detail-layout-grid">
        {/* 이미지 캐러셀 영역 */}
        <div className="detail-ga-image">
          <DesignImageCarousel images={carouselImages} />
        </div>

        {/* 정보 패널 — sticky */}
        <aside className="detail-ga-info detail-sticky border-secondary flex flex-col gap-5 rounded-[20px] border bg-white p-6">
          <div>
            <Badge variant="secondary" className="capitalize">
              {design.category}
            </Badge>
            <h1 className="mt-3 text-2xl font-bold">{design.title}</h1>
          </div>
          <Link href={`/profile/${design.author.id}`} className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-[50%] bg-[#e0e0d9]">
              {design.author.avatarUrl && (
                <Image
                  src={design.author.avatarUrl}
                  alt={design.author.name ?? '작성자'}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <div className="text-surface-dark text-sm font-bold">{design.author.name}</div>
              <div className="text-muted-foreground text-xs">{design.createdAt.toLocaleDateString()}</div>
            </div>
          </Link>

          {/* Instruction 다운로드 */}
          {design.instructions.length > 0 && (
            <div className="flex flex-col gap-2">
              {design.instructions.map((instruction, index) => (
                <InstructionDownloadButton
                  key={index}
                  designId={designId}
                  index={index}
                  label={design.instructionNames[index] || `Instruction_${index + 1}.pdf`}
                  isEnabled={viewerState !== 'guest'}
                />
              ))}
            </div>
          )}

          <div>
            {viewerState === 'guest' && (
              <Link href="/signin">
                <Button size="lg" className="h-auto w-full cursor-pointer text-sm">
                  <LogIn /> 로그인하고 다운로드하기
                </Button>
              </Link>
            )}

            {viewerState === 'owner' && (
              <Link href={`/designs/${designId}/edit`}>
                <Button size="lg" variant="secondary" className="h-auto w-full cursor-pointer text-sm">
                  <PencilLine /> 수정
                </Button>
              </Link>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="lg" className="h-auto flex-1 cursor-pointer text-sm">
              <Bookmark /> 저장
            </Button>
            <Button variant="secondary" size="lg" className="h-auto flex-1 cursor-pointer text-sm">
              <Share2 /> 공유
            </Button>
          </div>
        </aside>

        {/* 작품 설명 */}
        <div className="detail-ga-desc pt-7">{design.description}</div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 전체 타입 체크**

```bash
yarn tsc --noEmit
```

에러 0개여야 한다. 에러가 있다면 메시지를 확인해 해당 파일을 수정한다.

- [ ] **Step 3: 커밋**

```bash
git add src/app/\(main\)/designs/\[id\]/page.tsx
git commit -m "feat: 상세 페이지 ViewerState를 owner|viewer|guest 3가지로 단순화"
```

---

## Task 9: E2E 시나리오 문서 · Playwright 테스트 업데이트

**Files:**
- Modify: `docs/e2e/e2e-design-create.md`
- Modify: `docs/e2e/e2e-design-edit.md`
- Modify: `e2e/design-create.spec.ts`
- Modify: `e2e/design-edit.spec.ts`

### 배경

#### docs/e2e/e2e-design-create.md 변경 사항
- "무료 디자인 등록" → "디자인 등록"으로 리네임, Free 체크박스 단계(5번) 제거
- "유료 디자인 등록" 시나리오 전체 삭제
- "유효성 오류" 섹션에서 아래 3개 삭제: "유료 디자인에서 가격 미입력", "유료 디자인에서 Instructions 미업로드", "Free 전환 시 가격 오류 해소"

#### docs/e2e/e2e-design-edit.md 변경 사항
- "무료 디자인을 유료로 전환" 시나리오 전체 삭제
- "유료 디자인을 무료로 전환" 시나리오 전체 삭제
- "설명서 PDF 추가" 조건에서 "유료 디자인의 수정 페이지" → "수정 페이지"로 변경
- "유효성 오류" 섹션에서 "유료 전환 후 가격 미입력", "유료 전환 후 설명서 미첨부" 삭제

#### e2e/design-create.spec.ts 변경 사항

| 구분 | 변경 |
|------|------|
| "무료 디자인 등록 후 상세 페이지로 이동한다" | Free 체크박스 줄(line 30) 제거, 테스트명 수정 |
| "유료 디자인 등록 후 상세 페이지로 이동한다" | 테스트 전체 삭제 |
| "유료 상태에서 가격 미입력 시 오류 메시지가 표시된다" | 테스트 전체 삭제 |
| "유료 상태에서 PDF 미업로드 시 오류 메시지가 표시된다" | 테스트 전체 삭제 |
| "Free 체크박스 체크 시 가격 오류가 사라진다" | 테스트 전체 삭제 |
| "갤러리 이미지 없이 무료 디자인을 등록할 수 있다" | Free 체크박스 줄(line 173) 제거, 테스트명 수정 |
| "파일 업로드 실패 시..." (서버 에러 섹션) | Free 체크박스 줄(line 199) 제거 |

#### e2e/design-edit.spec.ts 변경 사항

| 구분 | 변경 |
|------|------|
| `createFreeDesign` 헬퍼 | Free 체크박스 줄 제거, 이름을 `createDesign`으로 변경 |
| `createDesignWithGallery` 헬퍼 | Free 체크박스 줄 제거 |
| `createPaidDesign` 헬퍼 | 삭제 후 `createDesignWithPdf`로 교체 |
| "무료 디자인을 유료로 전환하고 저장한다" | 테스트 전체 삭제 |
| "유료 디자인을 무료로 전환하고 저장한다" | 테스트 전체 삭제 |
| "유료 디자인에 설명서 PDF를 추가하고 저장한다" | `createPaidDesign` → `createDesignWithPdf` 사용, 테스트명 수정 |
| "유료 전환 후 가격 미입력 상태로 Save 시..." | 테스트 전체 삭제 |
| "유료 전환 후 설명서 미첨부 상태로 Save 시..." | 테스트 전체 삭제 |
| "PDF가 아닌 파일 업로드 시도 시..." | 유료 전환 줄 2개 제거 (checkbox.click, price.fill) |
| "설명서가 정확히 2개일 때 추가 슬롯이 표시되지 않는다" | `createPaidDesign` → `createDesignWithPdf` 사용 |

- [ ] **Step 1: docs/e2e/e2e-design-create.md 업데이트**

`docs/e2e/e2e-design-create.md`를 아래 내용으로 교체:

```markdown
# E2E 시나리오: 디자인 등록 (design-create)

## 정상 경로

### 디자인 등록

- **조건**: 로그인된 사용자가 디자인 등록 페이지에 접근한 상태
- **행동**:
  1. Title 입력란에 제목을 입력한다
  2. Description 입력란에 설명을 입력한다
  3. 카테고리 버튼 중 하나를 클릭해 선택한다
  4. 썸네일 업로드 영역을 클릭해 이미지 파일을 선택한다
  5. Publish 버튼을 클릭한다
- **결과**: 버튼이 "Publishing..." 상태로 바뀌고, 업로드 완료 후 생성된 디자인 상세 페이지로 이동한다

### 갤러리 이미지 드래그 앤 드롭 업로드

- **조건**: 디자인 등록 페이지, 썸네일이 아직 비어있는 상태
- **행동**: 이미지 파일을 썸네일 업로드 영역 위로 드래그해서 드롭한다
- **결과**: 해당 이미지가 썸네일로 미리보기 표시된다

### 업로드된 이미지 제거

- **조건**: 썸네일 또는 갤러리 이미지가 1개 이상 업로드된 상태
- **행동**: 업로드된 이미지 위의 X 버튼을 클릭한다
- **결과**: 해당 이미지가 목록에서 제거되고 빈 슬롯으로 돌아간다

### PDF 파일 업로드 후 제거

- **조건**: Instructions 섹션에 PDF 파일이 1개 업로드된 상태
- **행동**: 업로드된 PDF 항목의 Remove 버튼을 클릭한다
- **결과**: 해당 PDF가 목록에서 제거되고 업로드 슬롯이 다시 표시된다

---

## 인증 상태

### 비로그인 사용자의 등록 시도

- **조건**: 로그인되지 않은 사용자가 디자인 등록 페이지에 접근한 상태
- **행동**: 폼을 작성한 후 Publish 버튼을 클릭한다
- **결과**: 에러 메시지가 표시되고 페이지 이동이 일어나지 않는다

---

## 유효성 오류

### Title 미입력 제출

- **조건**: Title 입력란이 비어있는 상태
- **행동**: 다른 필드를 입력한 후 Publish 버튼을 클릭한다
- **결과**: Title 필드 아래에 "Title is required." 오류 메시지가 표시된다

### Title 120자 초과

- **조건**: Title 입력란에 121자 이상을 입력한 상태
- **행동**: Publish 버튼을 클릭한다
- **결과**: Title 필드 아래에 "Max 120 characters." 오류 메시지가 표시된다

### Description 미입력 제출

- **조건**: Description 입력란이 비어있는 상태
- **행동**: 다른 필드를 입력한 후 Publish 버튼을 클릭한다
- **결과**: Description 필드 아래에 "Description is required." 오류 메시지가 표시된다

### Category 미선택 제출

- **조건**: 카테고리가 선택되지 않은 상태
- **행동**: 다른 필드를 입력한 후 Publish 버튼을 클릭한다
- **결과**: Category 아래에 "Please select a category." 오류 메시지가 표시된다

### Thumbnail 미업로드 제출

- **조건**: 썸네일 이미지가 업로드되지 않은 상태
- **행동**: 다른 필드를 입력한 후 Publish 버튼을 클릭한다
- **결과**: 썸네일 업로드 영역이 빨간 테두리로 표시되고 "Thumbnail is required." 오류가 나타난다

---

## 경계 케이스

### 갤러리 이미지 최대 6장 도달

- **조건**: 갤러리 이미지가 이미 6장 업로드된 상태
- **행동**: 갤러리 그리드를 확인한다
- **결과**: + 버튼(추가 슬롯)이 더 이상 표시되지 않고 모든 6칸이 이미지로 채워진다

### PDF Instructions 최대 2개 도달

- **조건**: Instructions PDF가 이미 2개 업로드된 상태
- **행동**: Instructions 섹션을 확인한다
- **결과**: 추가 업로드 슬롯이 표시되지 않는다

### Title 정확히 120자 입력

- **조건**: 디자인 등록 폼
- **행동**: Title 입력란에 정확히 120자를 입력하고 Publish 버튼을 클릭한다
- **결과**: Title 관련 오류가 발생하지 않고 제출이 진행된다

### 갤러리 이미지 없이 등록

- **조건**: 썸네일만 업로드하고 갤러리 이미지는 추가하지 않은 상태
- **행동**: 나머지 필드를 입력하고 Publish 버튼을 클릭한다
- **결과**: 갤러리 이미지 없이 정상 등록되어 상세 페이지로 이동한다

---

## 서버·네트워크 오류

### 파일 업로드 실패

- **조건**: Supabase Storage 업로드가 실패하는 환경
- **행동**: 폼을 정상적으로 작성하고 Publish 버튼을 클릭한다
- **결과**: 폼 하단에 에러 메시지가 표시되고 페이지 이동이 일어나지 않는다

### DB 저장 실패

- **조건**: 파일 업로드는 성공하지만 DB 저장이 실패하는 환경
- **행동**: 폼을 정상적으로 작성하고 Publish 버튼을 클릭한다
- **결과**: 폼 하단에 에러 메시지가 표시되고 페이지 이동이 일어나지 않는다
```

- [ ] **Step 2: docs/e2e/e2e-design-edit.md 업데이트**

`docs/e2e/e2e-design-edit.md`에서 아래 내용을 수정한다:

**삭제할 시나리오 4개** (해당 섹션 전체를 파일에서 제거):
- "무료 디자인을 유료로 전환" (43~49번째 줄)
- "유료 디자인을 무료로 전환" (51~58번째 줄)
- "유료 전환 후 가격 미입력" (120~127번째 줄)
- "유료 전환 후 설명서 미첨부" (129~135번째 줄)

**수정할 시나리오 1개** — "설명서 PDF 추가" (60~67번째 줄):
```markdown
# 변경 전
### 설명서 PDF 추가

- **조건**: 로그인 상태, 유료 디자인의 수정 페이지, 설명서 슬롯에 여유가 있는 상태

# 변경 후
### 설명서 PDF 추가

- **조건**: 로그인 상태, 수정 페이지, 설명서 슬롯에 여유가 있는 상태
```

- [ ] **Step 3: e2e/design-create.spec.ts 업데이트**

`e2e/design-create.spec.ts`를 아래 내용으로 교체:

```typescript
import { test, expect, type Page } from '@playwright/test';
import path from 'path';

const IMAGE = path.join(__dirname, 'fixtures', 'test-image.png');
const PDF = path.join(__dirname, 'fixtures', 'test.pdf');

// 기본 정보 입력 헬퍼
async function fillBasicInfo(page: Page, opts?: { title?: string; description?: string; category?: string }) {
  const { title = 'E2E 테스트 디자인', description = '테스트용 설명입니다.', category = 'architecture' } = opts ?? {};
  await page.getByPlaceholder('e.g. Black Falcon Fortress').fill(title);
  await page.getByPlaceholder('Describe your creation, techniques, and inspiration...').fill(description);
  await page.getByRole('button', { name: category }).click();
}

// 썸네일 업로드 헬퍼
async function uploadThumbnail(page: Page) {
  await page.locator('input[type="file"][accept="image/*"]:not([multiple])').setInputFiles(IMAGE);
}

// ==================== 정상 경로 ====================

test.describe('정상 경로', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/designs/new');
  });

  test('디자인 등록 후 상세 페이지로 이동한다', async ({ page }) => {
    await fillBasicInfo(page);
    await uploadThumbnail(page);

    await page.getByRole('button', { name: 'Publish' }).click();

    await expect(page.getByRole('button', { name: 'Publishing...' })).toBeVisible();
    await expect(page).toHaveURL(/\/designs\/[^/]+$/, { timeout: 30000 });
  });

  test('업로드된 썸네일을 X 버튼으로 제거하면 빈 업로드 영역으로 돌아간다', async ({ page }) => {
    await uploadThumbnail(page);
    await expect(page.getByAltText('thumbnail')).toBeVisible();

    // aspect-square 컨테이너 내 X 버튼 클릭
    await page.locator('[class*="aspect-square"] button[type="button"]').click();

    await expect(page.getByText('Upload thumbnail')).toBeVisible();
    await expect(page.getByAltText('thumbnail')).not.toBeVisible();
  });

  test('업로드된 PDF를 Remove하면 업로드 슬롯이 다시 표시된다', async ({ page }) => {
    await page.locator('input[type="file"][accept=".pdf"]').setInputFiles(PDF);
    await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible();

    await page.getByRole('button', { name: 'Remove' }).click();

    await expect(page.getByText(/Upload Instructions PDF/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove' })).not.toBeVisible();
  });
});

// ==================== 유효성 오류 ====================

test.describe('유효성 오류', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/designs/new');
  });

  test('Title 미입력 시 오류 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Title is required.')).toBeVisible();
  });

  test('Title 121자 입력 시 최대 글자 수 오류가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('e.g. Black Falcon Fortress').fill('a'.repeat(121));
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Max 120 characters.')).toBeVisible();
  });

  test('Description 미입력 시 오류 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Description is required.')).toBeVisible();
  });

  test('Category 미선택 시 오류 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Please select a category.')).toBeVisible();
  });

  test('Thumbnail 미업로드 시 오류 메시지가 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Thumbnail is required.')).toBeVisible();
  });
});

// ==================== 경계 케이스 ====================

test.describe('경계 케이스', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/designs/new');
  });

  test('Title 정확히 120자 입력 시 Title 관련 오류가 없다', async ({ page }) => {
    await page.getByPlaceholder('e.g. Black Falcon Fortress').fill('a'.repeat(120));
    await page.getByRole('button', { name: 'Publish' }).click();

    await expect(page.getByText('Title is required.')).not.toBeVisible();
    await expect(page.getByText('Max 120 characters.')).not.toBeVisible();
  });

  test('갤러리 이미지 6장 업로드 후 추가 슬롯(+)이 사라진다', async ({ page }) => {
    const galleryInput = page.locator('input[type="file"][accept="image/*"][multiple]');
    await galleryInput.setInputFiles([IMAGE, IMAGE, IMAGE, IMAGE, IMAGE, IMAGE]);

    await expect(page.getByText('Gallery (6/6)')).toBeVisible();
    // 6장 가득 차면 isNext 슬롯이 사라지므로 갤러리 input이 DOM에서 제거됨
    await expect(galleryInput).not.toBeAttached();
  });

  test('PDF 2개 업로드 후 추가 업로드 슬롯이 사라진다', async ({ page }) => {
    const pdfInput = page.locator('input[type="file"][accept=".pdf"]');
    await pdfInput.setInputFiles(PDF);
    await pdfInput.setInputFiles(PDF);

    await expect(page.getByText(/Upload Instructions PDF/)).not.toBeVisible();
  });

  test('갤러리 이미지 없이 디자인을 등록할 수 있다', async ({ page }) => {
    await fillBasicInfo(page);
    await uploadThumbnail(page);

    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page).toHaveURL(/\/designs\/[^/]+$/, { timeout: 30000 });
  });
});

// ==================== 인증 상태 ====================

test.describe('인증 상태', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('비로그인 사용자가 등록 페이지에 접근하면 /signin으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/designs/new');
    await expect(page).toHaveURL(/signin/);
  });
});

// ==================== 서버·네트워크 오류 ====================

test.describe('서버·네트워크 오류', () => {
  test('파일 업로드 실패 시 에러 메시지가 표시되고 페이지 이동이 없다', async ({ page }) => {
    await page.goto('/designs/new');
    await fillBasicInfo(page);
    await uploadThumbnail(page);

    // Supabase Storage 요청 차단
    await page.route('**/storage/v1/object/**', route => route.abort());

    await page.getByRole('button', { name: 'Publish' }).click();

    // Publish 버튼이 다시 활성화될 때까지 대기 (isPending=false)
    await expect(page.getByRole('button', { name: 'Publish' })).toBeEnabled({ timeout: 30000 });
    await expect(page).toHaveURL('/designs/new');
    await expect(page.locator('p.text-red-500').last()).toBeVisible();
  });
});
```

- [ ] **Step 4: e2e/design-edit.spec.ts 업데이트**

`e2e/design-edit.spec.ts`를 아래 내용으로 교체:

```typescript
import { test, expect, type Page } from '@playwright/test';
import path from 'path';

const IMAGE = path.join(__dirname, 'fixtures', 'test-image.png');
const PDF = path.join(__dirname, 'fixtures', 'test.pdf');

// 기본 정보 채우기
async function fillBasicInfo(
  page: Page,
  opts?: { title?: string; description?: string; category?: string }
) {
  const {
    title = 'E2E 수정 테스트 디자인',
    description = '수정 테스트용 설명입니다.',
    category = 'architecture',
  } = opts ?? {};
  await page.getByPlaceholder('e.g. Black Falcon Fortress').fill(title);
  await page
    .getByPlaceholder('Describe your creation, techniques, and inspiration...')
    .fill(description);
  await page.getByRole('button', { name: category }).click();
}

// 기본 디자인(썸네일만) 생성 → designId 반환
async function createDesign(page: Page): Promise<string> {
  await page.goto('/designs/new');
  await fillBasicInfo(page);
  await page
    .locator('input[type="file"][accept="image/*"]:not([multiple])')
    .setInputFiles(IMAGE);
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.waitForURL(/\/designs\/[0-9a-f-]{36}$/, { timeout: 30000 });
  const url = page.url();
  return url.split('/designs/')[1];
}

// 갤러리 이미지 n장을 포함한 디자인 생성 → designId 반환
async function createDesignWithGallery(page: Page, count: number): Promise<string> {
  await page.goto('/designs/new');
  await fillBasicInfo(page);
  await page
    .locator('input[type="file"][accept="image/*"]:not([multiple])')
    .setInputFiles(IMAGE);
  const galleryInput = page.locator('input[type="file"][accept="image/*"][multiple]');
  await galleryInput.setInputFiles(Array(count).fill(IMAGE));
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.waitForURL(/\/designs\/[0-9a-f-]{36}$/, { timeout: 30000 });
  return page.url().split('/designs/')[1];
}

// PDF 1개를 포함한 디자인 생성 → designId 반환
async function createDesignWithPdf(page: Page): Promise<string> {
  await page.goto('/designs/new');
  await fillBasicInfo(page);
  await page
    .locator('input[type="file"][accept="image/*"]:not([multiple])')
    .setInputFiles(IMAGE);
  await page.locator('input[type="file"][accept=".pdf"]').setInputFiles(PDF);
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.waitForURL(/\/designs\/[0-9a-f-]{36}$/, { timeout: 30000 });
  return page.url().split('/designs/')[1];
}

// ==================== 정상 경로 ====================

test.describe('정상 경로', () => {
  test('기본 정보를 수정하고 저장하면 상세 페이지로 이동한다', async ({ page }) => {
    const designId = await createDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    await page.getByPlaceholder('e.g. Black Falcon Fortress').clear();
    await page.getByPlaceholder('e.g. Black Falcon Fortress').fill('수정된 제목');
    await page
      .getByPlaceholder('Describe your creation, techniques, and inspiration...')
      .clear();
    await page
      .getByPlaceholder('Describe your creation, techniques, and inspiration...')
      .fill('수정된 설명입니다.');
    await page.getByRole('button', { name: 'castles' }).click();

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });

  test('썸네일을 제거하고 새 이미지로 교체 후 저장한다', async ({ page }) => {
    const designId = await createDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    // 기존 썸네일 제거
    await page.locator('[class*="aspect-square"] button[type="button"]').click();
    await expect(page.getByText('Upload thumbnail')).toBeVisible();

    // 새 썸네일 업로드
    await page
      .locator('input[type="file"][accept="image/*"]:not([multiple])')
      .setInputFiles(IMAGE);
    await expect(page.getByAltText('thumbnail')).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });

  test('갤러리 이미지 1장을 추가하고 저장하면 기존 이미지와 합산된다', async ({ page }) => {
    const designId = await createDesignWithGallery(page, 3);
    await page.goto(`/designs/${designId}/edit`);

    await expect(page.getByText('Gallery (3/6)')).toBeVisible();
    const galleryInput = page.locator('input[type="file"][accept="image/*"][multiple]');
    await galleryInput.setInputFiles(IMAGE);
    await expect(page.getByText('Gallery (4/6)')).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });

  test('갤러리 이미지 1장을 제거하고 저장하면 제거한 이미지가 제외된다', async ({ page }) => {
    const designId = await createDesignWithGallery(page, 4);
    await page.goto(`/designs/${designId}/edit`);

    await expect(page.getByText('Gallery (4/6)')).toBeVisible();
    await page
      .locator('div.grid-cols-3 div.relative button[type="button"]')
      .first()
      .click();
    await expect(page.getByText('Gallery (3/6)')).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });

  test('설명서 PDF를 추가하고 저장한다', async ({ page }) => {
    const designId = await createDesignWithPdf(page); // PDF 1개 포함
    await page.goto(`/designs/${designId}/edit`);

    // 두 번째 PDF 추가 (슬롯 1개 남아 있음)
    await page.locator('input[type="file"][accept=".pdf"]').setInputFiles(PDF);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });

  test('Delete 버튼으로 디자인을 삭제하면 홈으로 이동한다', async ({ page }) => {
    const designId = await createDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    // window.confirm() 자동 수락
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page).toHaveURL('/', { timeout: 30000 });
  });
});

// ==================== 인증 상태 ====================

test.describe('인증 상태 - 비로그인', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('비로그인 사용자가 수정 페이지에 직접 접근하면 /signin으로 리다이렉트된다', async ({
    page,
  }) => {
    await page.goto('/designs/00000000-0000-0000-0000-000000000000/edit');
    await expect(page).toHaveURL(/signin/);
  });
});

// ==================== 유효성 오류 ====================

test.describe('유효성 오류', () => {
  let designId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/user.json' });
    const page = await context.newPage();
    designId = await createDesign(page);
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/designs/${designId}/edit`);
  });

  test('제목 필드를 비우고 Save 시 오류 메시지가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('e.g. Black Falcon Fortress').clear();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Title is required.')).toBeVisible();
  });

  test('제목 121자 입력 시 최대 글자 수 오류가 표시된다', async ({ page }) => {
    await page.getByPlaceholder('e.g. Black Falcon Fortress').fill('a'.repeat(121));
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Max 120 characters.')).toBeVisible();
  });

  test('설명 필드를 비우고 Save 시 오류 메시지가 표시된다', async ({ page }) => {
    await page
      .getByPlaceholder('Describe your creation, techniques, and inspiration...')
      .clear();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Description is required.')).toBeVisible();
  });

  test('PDF가 아닌 파일 업로드 시도 시 에러 메시지가 표시된다', async ({ page }) => {
    await page.locator('input[type="file"][accept=".pdf"]').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake png content'),
    });
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Only PDF files are allowed.')).toBeVisible();
  });

  test('10MB 초과 이미지 업로드 시 에러 메시지가 표시된다', async ({ page }) => {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    await page
      .locator('input[type="file"][accept="image/*"]:not([multiple])')
      .setInputFiles({
        name: 'large.png',
        mimeType: 'image/png',
        buffer: largeBuffer,
      });
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Max file size is 10MB.')).toBeVisible();
  });
});

// ==================== 경계 케이스 ====================

test.describe('경계 케이스', () => {
  test('갤러리 이미지가 정확히 6장일 때 추가 슬롯이 표시되지 않는다', async ({ page }) => {
    const designId = await createDesignWithGallery(page, 6);
    await page.goto(`/designs/${designId}/edit`);

    await expect(page.getByText('Gallery (6/6)')).toBeVisible();
    const galleryInput = page.locator('input[type="file"][accept="image/*"][multiple]');
    await expect(galleryInput).not.toBeAttached();
  });

  test('설명서가 정확히 2개일 때 추가 슬롯이 표시되지 않는다', async ({ page }) => {
    // PDF 1개짜리 디자인 생성 후 2번째 PDF 추가해서 저장
    const designId = await createDesignWithPdf(page);
    await page.goto(`/designs/${designId}/edit`);
    await page.locator('input[type="file"][accept=".pdf"]').setInputFiles(PDF);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL(`/designs/${designId}`, { timeout: 30000 });

    // PDF 2개 상태로 edit 재진입 — 업로드 슬롯 버튼이 표시되지 않아야 함
    await page.goto(`/designs/${designId}/edit`);
    await expect(page.getByText('Upload Instructions PDF (2/2)')).not.toBeVisible();
  });

  test('설명 정확히 2000자 입력 후 저장하면 에러 없이 저장된다', async ({ page }) => {
    const designId = await createDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    await page
      .getByPlaceholder('Describe your creation, techniques, and inspiration...')
      .fill('a'.repeat(2000));
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Max 2000 characters.')).not.toBeVisible();
    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });

  test('기존 이미지 1장 제거 + 신규 이미지 1장 추가 후 저장하면 혼합 저장된다', async ({
    page,
  }) => {
    const designId = await createDesignWithGallery(page, 3);
    await page.goto(`/designs/${designId}/edit`);

    // 첫 번째 기존 이미지 제거
    await page.locator('div.grid-cols-3 div.relative button[type="button"]').first().click();
    await expect(page.getByText('Gallery (2/6)')).toBeVisible();

    // 새 이미지 1장 추가
    await page.locator('input[type="file"][accept="image/*"][multiple]').setInputFiles(IMAGE);
    await expect(page.getByText('Gallery (3/6)')).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(`/designs/${designId}`, { timeout: 30000 });
  });
});

// ==================== 서버·네트워크 오류 ====================

test.describe('서버·네트워크 오류', () => {
  test('파일 업로드 실패 시 에러 메시지가 표시되고 페이지 이동이 없다', async ({ page }) => {
    const designId = await createDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    // 새 이미지 추가
    await page.locator('input[type="file"][accept="image/*"][multiple]').setInputFiles(IMAGE);

    // Supabase Storage 업로드 차단
    await page.route('**/storage/v1/object/**', route => route.abort());

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled({ timeout: 30000 });
    await expect(page).toHaveURL(`/designs/${designId}/edit`);
    await expect(page.locator('p.text-red-500')).toBeVisible();
  });

  test('DB 저장 실패 시 에러 메시지가 표시되고 페이지 이동이 없다', async ({ page }) => {
    const designId = await createDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    // Next.js 서버 액션 차단 (POST to current page URL)
    await page.route(`**/designs/${designId}/edit`, route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled({ timeout: 30000 });
    await expect(page).toHaveURL(`/designs/${designId}/edit`);
    await expect(page.locator('p.text-red-500')).toBeVisible();
  });

  test('삭제 실패 시 에러 메시지가 표시되고 홈으로 이동하지 않는다', async ({ page }) => {
    const designId = await createDesign(page);
    await page.goto(`/designs/${designId}/edit`);

    // 서버 액션 차단
    await page.route(`**/designs/${designId}/edit`, route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByRole('button', { name: 'Delete' })).toBeEnabled({ timeout: 30000 });
    await expect(page).not.toHaveURL('/');
    await expect(page.locator('p.text-red-500')).toBeVisible();
  });
});
```

- [ ] **Step 5: E2E 테스트 실행**

```bash
yarn playwright test e2e/design-create.spec.ts e2e/design-edit.spec.ts
```

모든 테스트 통과 확인. 실패한 테스트가 있다면 에러 메시지를 확인해 수정한다.

- [ ] **Step 6: 전체 타입 체크 + 린트**

```bash
yarn tsc --noEmit && yarn lint
```

에러 없음 확인.

- [ ] **Step 7: 커밋**

```bash
git add docs/e2e/ e2e/design-create.spec.ts e2e/design-edit.spec.ts
git commit -m "test: 가격/유무료 관련 E2E 시나리오 문서 및 테스트 제거"
```

---

## 최종 검증

```bash
# 타입 체크
yarn tsc --noEmit

# 린트
yarn lint

# E2E 전체 실행
yarn playwright test
```

수동 확인:
- `yarn dev` 실행 후 `/designs/new` — Price 섹션 없음
- `/designs/{id}/edit` — Price 섹션 없음
- 로그인 상태로 instructions 있는 디자인 상세 — 다운로드 버튼 활성화
- 비로그인 상태로 동일 상세 페이지 — 자물쇠 아이콘 + "로그인하고 다운로드하기" 버튼
- 디자인 카드 hover — 가격 표시 없음
