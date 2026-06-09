# Design Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 디자인 수정 폼(`DesignEditForm.tsx`) Save 버튼 옆에 삭제 버튼을 추가하고, 클릭 시 브라우저 confirm → DB + 스토리지 파일 전체 삭제 → 홈 리다이렉트 흐름을 구현한다.

**Architecture:** 서버 액션(`deleteDesign`)이 DB 삭제 → 스토리지 전체 삭제를 순서대로 처리한다. 뮤테이션 훅은 해당 액션을 래핑하는 단순 구조다. `DesignEditForm`이 이미 클라이언트 컴포넌트이므로 별도 컴포넌트 분리 없이 훅과 버튼을 직접 추가한다.

**Tech Stack:** Next.js App Router, TanStack Query (`useMutation`), Prisma, Supabase Storage, lucide-react

---

## File Map

| 역할 | 파일 | 변경 |
|------|------|------|
| 서버 액션 | `src/features/design-edit/design-edit.actions.ts` | 수정 — `deleteDesign` 추가 |
| 뮤테이션 훅 | `src/features/design-edit/design-edit.mutate.ts` | 수정 — `useDeleteDesignMutation` 추가 |
| 삭제 버튼 UI | `src/features/design-edit/ui/DesignEditForm.tsx` | 수정 — Save 버튼 옆에 삭제 버튼 추가 |

---

### Task 1: `deleteDesign` 서버 액션 추가

**Files:**
- Modify: `src/features/design-edit/design-edit.actions.ts`

- [ ] **Step 1: `design-edit.actions.ts`에 `deleteDesign` 함수 추가**

파일 상단 import 목록에 추가:

```typescript
import { removeUserPrefix } from '@/shared/api/supabase/storage.actions';
```

파일 끝(`updateDesign` 함수 아래)에 추가:

```typescript
// 디자인 삭제 서버 액션 — DB 먼저 삭제 후 스토리지 폴더 전체 정리
export async function deleteDesign(designId: string): Promise<void> {
  // 로그인 확인
  const user = await getAuthSession();
  if (!user) throw new Error('로그인이 필요합니다.');

  // 소유권 확인
  const existing = await prisma.design.findUnique({ where: { id: designId } });
  if (!existing || existing.authorId !== user.id) throw new Error('삭제 권한이 없습니다.');

  // 1. DB 삭제
  await prisma.design.delete({ where: { id: designId } });

  // 2. 스토리지 폴더 전체 삭제 (두 버킷 모두)
  await removeUserPrefix(`${user.id}/${designId}`);
}
```

- [ ] **Step 2: 빌드 타입 검사**

```bash
cd /Users/baeg-uhyeog/Desktop/moc && yarn tsc --noEmit 2>&1 | head -30
```

Expected: 오류 없음 (또는 이 파일과 무관한 기존 오류만)

- [ ] **Step 3: Commit**

```bash
git add src/features/design-edit/design-edit.actions.ts
git commit -m "feat: add deleteDesign server action"
```

---

### Task 2: `useDeleteDesignMutation` 훅 추가

**Files:**
- Modify: `src/features/design-edit/design-edit.mutate.ts`

- [ ] **Step 1: `design-edit.mutate.ts`에 훅 추가**

파일 상단 import 수정 (`deleteDesign` 추가):

```typescript
import { updateDesign, deleteDesign } from './design-edit.actions';
```

파일 끝에 추가:

```typescript
type DeleteDesignMutationOptions = UseMutationOptions<void, Error, string>;

// 디자인 삭제 useMutation 훅
export function useDeleteDesignMutation(options?: DeleteDesignMutationOptions) {
  return useMutation<void, Error, string>({
    mutationFn: (designId: string) => deleteDesign(designId),
    ...options
  });
}
```

- [ ] **Step 2: 빌드 타입 검사**

```bash
cd /Users/baeg-uhyeog/Desktop/moc && yarn tsc --noEmit 2>&1 | head -30
```

Expected: 오류 없음

- [ ] **Step 3: Commit**

```bash
git add src/features/design-edit/design-edit.mutate.ts
git commit -m "feat: add useDeleteDesignMutation hook"
```

---

### Task 3: `DesignEditForm`에 삭제 버튼 추가 및 검증

**Files:**
- Modify: `src/features/design-edit/ui/DesignEditForm.tsx`

- [ ] **Step 1: import 수정**

기존 hooks import:

```typescript
import { useUpdateDesignMutation } from '../design-edit.mutate';
```

교체:

```typescript
import { useUpdateDesignMutation, useDeleteDesignMutation } from '../design-edit.mutate';
```

기존 icons import:

```typescript
import { Check } from 'lucide-react';
```

교체:

```typescript
import { Check, Trash2 } from 'lucide-react';
```

- [ ] **Step 2: `DesignEditForm` 컴포넌트 내부에 삭제 뮤테이션 훅 추가**

기존 코드 (`useUpdateDesignMutation` 선언 바로 아래, `onSubmit` 선언 위):

```typescript
const { mutate, isPending, isError, error } = useUpdateDesignMutation({
  onSuccess: ({ designId }) => router.push(`/designs/${designId}`)
});
```

아래에 추가:

```typescript
// 디자인 삭제 뮤테이션 — 성공 시 홈으로 이동
const { mutate: deleteDesign, isPending: isDeleting } = useDeleteDesignMutation({
  onSuccess: () => router.push('/')
});

// 삭제 핸들러
function handleDelete() {
  if (!window.confirm('Are you sure you want to delete this design? This action cannot be undone.')) return;
  deleteDesign(design.id);
}
```

- [ ] **Step 3: 제출 버튼 영역에 삭제 버튼 추가**

기존 코드 (제출 버튼 영역):

```tsx
{/* 제출 버튼 */}
<div className="flex justify-end">
  <Button type="submit" size="lg" disabled={isPending} className="rounded-xl px-7 text-[14px] font-bold">
    <Check className="h-4 w-4" />
    {isPending ? 'Saving...' : 'Save'}
  </Button>
</div>
```

교체:

```tsx
{/* 제출/삭제 버튼 */}
<div className="flex justify-end gap-2">
  <Button
    type="button"
    size="lg"
    variant="destructive"
    disabled={isDeleting || isPending}
    className="rounded-xl px-7 text-[14px] font-bold"
    onClick={handleDelete}
  >
    <Trash2 className="h-4 w-4" />
    {isDeleting ? 'Deleting...' : 'Delete'}
  </Button>
  <Button type="submit" size="lg" disabled={isPending || isDeleting} className="rounded-xl px-7 text-[14px] font-bold">
    <Check className="h-4 w-4" />
    {isPending ? 'Saving...' : 'Save'}
  </Button>
</div>
```

- [ ] **Step 4: 개발 서버 실행**

```bash
cd /Users/baeg-uhyeog/Desktop/moc && yarn dev
```

- [ ] **Step 5: Playwright MCP로 UI 동작 확인**

Playwright MCP(`mcp__playwright__*`) 툴 사용:
1. `browser_navigate` → 로그인 상태로 본인 디자인 수정 페이지(`/designs/{id}/edit`) 진입
2. `browser_snapshot` → 폼 하단에 Delete / Save 버튼이 나란히 렌더링됨 확인
3. `browser_click` → Delete 버튼 클릭
4. `browser_handle_dialog` → confirm 텍스트가 `"Are you sure you want to delete this design? This action cannot be undone."` 임을 확인하고 **취소** 선택
5. `browser_snapshot` → 페이지 그대로, 변경 없음 확인
6. `browser_click` → Delete 버튼 다시 클릭
7. `browser_handle_dialog` → confirm **확인** 선택
8. `browser_wait_for` → URL이 `/`로 변경됨 확인

- [ ] **Step 6: Supabase MCP로 데이터 정합성 확인**

Supabase MCP(`mcp__supabase__*`) 툴 사용:
1. `execute_sql` → 삭제된 디자인 ID로 조회: `SELECT id FROM "Design" WHERE id = '<designId>';` → 0 rows 확인
2. Storage 버킷에서 `{userId}/{designId}` 폴더가 없음 확인
