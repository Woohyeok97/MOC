# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 명령어

```bash
yarn dev        # 개발 서버 실행
yarn build      # 프로덕션 빌드
yarn lint       # ESLint 실행
yarn format     # Prettier 포맷팅
```

패키지 매니저는 yarn (v4.9.3) 사용.

## 아키텍처

Feature-Sliced Design (FSD) 아키텍처를 따름:

```
src/
├── app/          # Next.js App Router - 라우팅 및 레이아웃
├── features/     # 기능별 모듈 (auth, design-create 등)
├── entities/     # 도메인 엔티티 (design, user)
├── widgets/      # 복합 레이아웃 컴포넌트 (Header, Sidebar, Footer)
├── shared/       # 재사용 가능한 UI, 유틸리티, API 클라이언트
└── generated/    # Prisma 자동 생성 타입 (src/generated/prisma/)
```

### 핵심 패턴

**레이어 임포트 방향**: `app → widgets → features → entities → shared` 단방향만 허용. 하위 레이어가 상위 레이어를 임포트하면 안 됨.

**서버 컴포넌트 기본**: 대부분의 컴포넌트는 서버 컴포넌트. `'use client'`는 인터랙티브한 컴포넌트에만 사용.

**인증 흐름**: Root layout(server) → AuthProvider(client) → useAuthStore(Zustand). `getCurrentUser()`는 `React.cache()`로 감싸서 단일 렌더 내 중복 호출 방지.

**경로 별칭**: `@/*` → `src/*` (상대 경로 사용 금지)

**폼 검증**: React Hook Form + Zod.

## 코딩 컨벤션

### 파일 네이밍

feature/entity 내부 파일은 `[name].[type].ts(x)` 패턴 사용:
- `auth.actions.ts` — 서버 액션 (side effect: DB write, 로그아웃 등)
- `auth.api.ts` — 데이터 페칭 함수 (read-only, `React.cache()` 사용)
- `auth.store.ts` — Zustand 스토어
- `design.type.ts` — 타입 정의
- `design-create.schema.ts` — Zod 스키마
- UI 컴포넌트는 PascalCase: `DesignCreateForm.tsx`

### 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| React 컴포넌트 | PascalCase | `DesignCard` |
| Zod 스키마 | PascalCase + `Schema` suffix | `DesignCreateSchema` |
| 스키마 추론 타입 | PascalCase + `FormType` suffix | `DesignCreateFormType` |
| Zustand 스토어 | `use[Feature]Store` | `useAuthStore` |
| 스토어 인터페이스 | `[Feature]State` | `AuthState` |
| API 함수 | `get[Entity]` | `getDesigns`, `getCurrentUser` |
| 상수 | UPPER_SNAKE_CASE | `MAX_IMAGE_COUNT` |

### 타입 임포트

`type` 키워드를 명시적으로 사용:
```typescript
import type { UserProfile } from '@/entities/user/user.type';
```

### 주석 스타일

주석과 Zod 에러 메시지는 한국어로 작성. 단, 임포트 그룹 레이블은 영어 허용.

**파일 상단**: 파일 목적을 한 줄로 설명
```typescript
// 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트 생성 유틸
```

**임포트 그룹 구분**: 카테고리별로 `//` 구분선 사용 (레이블은 영어)
```typescript
// components
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
// types & schemas
import type { DesignCreateFormType } from '../design-create.schema';
// icons
import { ArrowLeft } from 'lucide-react';
```

**함수 내 섹션 구분**: 논리적 단위마다 한 줄 주석
```typescript
// form state
const { register, handleSubmit } = useForm();
// on submit handler
const onSubmit = () => { ... };
```

**복잡한 흐름**: 번호를 붙여 단계별로 설명
```typescript
// 1. 임시 code → access_token + refresh_token 교환
// 2. 쿠키에서 유저 정보 추출
// 3. users 테이블 동기화
```

**인라인 주석**: 코드 끝에 간결하게
```typescript
const thumbnailUrl = design.images[0] ?? ''; // 썸네일
```

**TODO**: 미완성 작업 표시
```typescript
// TODO: DB 연결 후 prisma.design.findMany로 교체
```

**JSX 내 주석**: `{/* */}` 사용
```tsx
{/* 모바일에서는 하단 네비게이션으로 대체 */}
```
