# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 스킬 사용 투명성 규칙 (모든 응답에 적용, 예외 없음)

스킬(자동/수동 발동 모두)을 사용할 때 항상 다음을 지킬 것:

1. **응답 첫 줄에 표시**: `🔧 사용 스킬: [스킬명] | 이유: [한 줄]`
2. **여러 스킬 동시 사용 시** 모두 나열
3. **응답 끝에 요약**: `📋 이 응답에 사용된 스킬: [목록]`
4. **스킬을 사용하지 않은 응답**에는 위 표시를 하지 말 것
5. 이 규칙 자체는 "스킬"이 아니므로 표시 대상이 아님

## 명령어

```bash
yarn dev        # 개발 서버 실행
yarn build      # 프로덕션 빌드
yarn lint       # ESLint 실행
yarn format     # Prettier 포맷팅
```

패키지 매니저: yarn (v4.9.3)

## 아키텍처

Feature-Sliced Design (FSD) 아키텍처:

```
src/
├── app/          # Next.js App Router - 라우팅 및 레이아웃
├── features/     # 기능별 모듈 (auth, design-create 등)
├── entities/     # 도메인 엔티티 (design, user)
├── widgets/      # 복합 레이아웃 컴포넌트 (Header, Sidebar, Footer)
├── shared/       # 재사용 가능한 UI, 유틸리티, API 클라이언트
└── generated/    # Prisma 자동 생성 타입
```

**핵심 규칙:**

- **레이어 임포트 방향**: `app → widgets → features → entities → shared` 단방향만 허용
- **서버 컴포넌트 기본**: `'use client'`는 인터랙티브 컴포넌트에만 사용
- **인증 흐름**: Root layout(server) → AuthProvider(client) → useAuthStore(Zustand). `getCurrentUser()`는 `React.cache()` 사용
- **경로 별칭**: `@/*` → `src/*` (상대 경로 사용 금지)
- **폼 검증**: React Hook Form + Zod

## 코딩 컨벤션

### 작업 원칙

- **요청 이상 구현 금지** — "시니어 엔지니어가 보면 과하다 할까?" 자문
- **모호하면 묻기** — 해석이 여러 가지면 나열해서 확인, 혼자 선택 금지
- **shared/ui 우선** — 새 컴포넌트 작성 전 `src/shared/ui/`에 적합한 것 있는지 확인. 없으면 shadcn/ui 기준으로 추가할지 사용자에게 먼저 확인
- **스타일링**: `style` 속성 대신 Tailwind 클래스 사용
- **네이밍**: 역할이 즉시 파악되는 명확한 이름

### 파일 네이밍

feature/entity 내부 파일은 `[name].[type].ts(x)` 패턴:

| Suffix        | 용도                                          |
| ------------- | --------------------------------------------- |
| `.actions.ts` | 서버 액션 (DB write, 로그아웃 등)             |
| `.api.ts`     | 데이터 페칭 (read-only, `React.cache()` 사용) |
| `.store.ts`   | Zustand 스토어                                |
| `.type.ts`    | 타입 정의                                     |
| `.schema.ts`  | Zod 스키마                                    |

UI 컴포넌트는 PascalCase 파일명: `DesignCreateForm.tsx`

### 네이밍 규칙

| 대상              | 규칙                    | 예시                           |
| ----------------- | ----------------------- | ------------------------------ |
| React 컴포넌트    | PascalCase              | `DesignCard`                   |
| Zod 스키마        | PascalCase + `Schema`   | `DesignCreateSchema`           |
| 스키마 추론 타입  | PascalCase + `FormType` | `DesignCreateFormType`         |
| 도메인 엔티티 타입 | PascalCase + `Type`    | `PurchaseItemType`, `UserProfileType` |
| Zustand 스토어    | `use[Feature]Store`     | `useAuthStore`                 |
| 스토어 인터페이스 | `[Feature]State`        | `AuthState`                    |
| API 함수          | `get[Entity]`           | `getDesigns`, `getCurrentUser` |
| 상수              | UPPER_SNAKE_CASE        | `MAX_IMAGE_COUNT`              |

> **도메인 엔티티 타입**: `*.type.ts` 파일에 정의하는 interface/type 중 도메인 객체를 나타내는 것에만 적용. 라우트 파라미터(`Params`), 유틸리티 타입 등 로컬 범위에서 쓰는 보조 타입은 제외.

### 타입 임포트

`type` 키워드 명시:

```typescript
import type { UserProfile } from '@/entities/user/user.type';
```

## 주석 스타일

**언어**: 주석과 Zod 에러 메시지는 한국어. 임포트 그룹 레이블만 영어.

**파일 상단**: 파일 목적을 한 줄로

```typescript
// 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트 생성 유틸
```

**임포트 그룹**: 카테고리별로 `//` 구분선 (레이블 영어)

```typescript
// components
import { Button } from '@/shared/ui/button';
// types & schemas
import type { DesignCreateFormType } from '../design-create.schema';
// icons
import { ArrowLeft } from 'lucide-react';
```

**함수 내**: 논리 단위마다 한 줄 주석 (`// form state`, `// on submit handler`)

**복잡한 흐름**: 번호 단계로 (`// 1. ...`, `// 2. ...`)

**인라인**: 짧게 (`const thumbnailUrl = design.images[0] ?? ''; // 썸네일`)

**미완성 작업**: `// TODO: ...`

**JSX 내**: `{/* */}` 사용
