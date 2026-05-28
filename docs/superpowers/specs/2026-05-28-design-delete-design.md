# 디자인 삭제 기능

**날짜:** 2026-05-28  
**브랜치:** feature/edit-design

---

## Context

디자인 상세 페이지에 수정 버튼만 있고 삭제 기능이 없어서, 소유자가 자신의 디자인을 삭제할 수 없는 상태. 수정 버튼 옆에 삭제 버튼을 추가하고, 삭제 시 DB 레코드와 스토리지 파일을 모두 정리해야 한다.

---

## 설계

### 1. `deleteDesign` 서버 액션

**파일:** `src/features/design-edit/design-edit.actions.ts` (기존 파일에 추가)

**동작:**
1. 인증 확인 (`getAuthSession()`)
2. 소유권 확인 (`prisma.design.findUnique` → `authorId !== user.id` 이면 거부)
3. DB 레코드 삭제 (`prisma.design.delete`)
4. 스토리지 파일 전체 삭제 (`removeUserPrefix(`${userId}/${designId}`)`)

**삭제 순서 근거:** DB 먼저 삭제.  
DB 삭제 실패 → 아무것도 변경 안됨 (안전).  
DB 성공 + 스토리지 실패 → 고아 파일만 남음 (사용자에게 노출 안됨, 허용 가능).  
반대 순서면 DB 레코드가 없는 파일을 가리키게 돼 오류 발생.

**의존성:**
- `removeUserPrefix` from `@/shared/api/supabase/storage.actions` (기존 유틸)
- `getAuthSession` from `@/shared/api/supabase/auth`
- Prisma client

---

### 2. `useDeleteDesignMutation` 훅

**파일:** `src/features/design-edit/design-edit.mutate.ts` (기존 파일에 추가)

```typescript
type DeleteDesignMutationOptions = UseMutationOptions<void, Error, string>; // string = designId

export function useDeleteDesignMutation(options?: DeleteDesignMutationOptions)
```

- 뮤테이션 입력: `designId: string`
- `deleteDesign(designId)` 호출만 함 (파일 분류/롤백 로직 불필요)
- update 훅과 동일하게 `options` prop으로 `onSuccess`, `onError` 위임

---

### 3. UI — 삭제 버튼 + 브라우저 confirm

**파일:** `src/app/(main)/designs/[id]/page.tsx`

**배치:** 기존 수정 버튼(`<Link href=".../edit">`) 옆에 삭제 버튼 추가.  
`viewerState === 'owner'` 조건 블록 안에 함께 위치.

**UX 흐름:**
1. 삭제 버튼 클릭 → `window.confirm("Are you sure you want to delete this design? This action cannot be undone.")` 표시
2. 취소 → 아무것도 하지 않음
3. 확인 → `useDeleteDesignMutation` 호출, 버튼 disabled
4. 성공 → `router.push('/')`

**비고:** `shared/ui`에 AlertDialog 컴포넌트가 없어 브라우저 기본 confirm 사용. 클라이언트 컴포넌트이므로 `window.confirm` 직접 호출 가능.

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `src/features/design-edit/design-edit.actions.ts` | `deleteDesign` 서버 액션 추가 |
| `src/features/design-edit/design-edit.mutate.ts` | `useDeleteDesignMutation` 훅 추가 |
| `src/app/(main)/designs/[id]/page.tsx` | 삭제 버튼 + 브라우저 confirm UI 추가 |

---

## 검증

**Playwright MCP로 브라우저 동작 확인:**
1. 소유자로 로그인 → 디자인 상세 페이지 진입 → 수정 버튼 옆에 삭제 버튼 표시 확인
2. 삭제 버튼 클릭 → 브라우저 confirm 다이얼로그 표시 확인
3. 취소 선택 → 페이지 이동 없음, 변경 없음 확인
4. 삭제 확인 선택 → 홈(`/`)으로 리다이렉트 확인

**Supabase MCP로 데이터 정합성 확인:**
5. `execute_sql`로 삭제된 디자인 ID 조회 → 레코드 없음 확인
6. `get_logs` 또는 Storage 버킷 조회로 `{userId}/{designId}` 폴더 전체 삭제 확인

**권한 검증:**
7. 비소유자 계정으로 `deleteDesign` 직접 호출 → 권한 오류(`Error`) throw 확인
