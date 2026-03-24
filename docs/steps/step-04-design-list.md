# Step 4. 도안 목록 페이지 (`/`)

## 목표

홈(`/`)에서 등록된 도안을 최신순으로 조회하고, 각 카드에 대표 썸네일/제목/카테고리를 표시한다.  
로그인 여부와 관계없이 누구나 접근 가능하며, 각 카드를 통해 상세 페이지로 이동할 수 있다.

---

## 사용 기술 & 라이브러리

| 패키지 | 용도 | 비고 |
| ------ | ---- | ---- |
| `@prisma/client` | Design 모델 타입 추론 | 기존 |

---

## 구현 순서

1. 도안 목록 조회 API 함수 생성 (`src/entities/design/design.api.ts`)
   - `createdAt` 기준 최신순 정렬(`orderBy: { createdAt: 'desc' }`)
   - `findMany`로 Prisma `Design` 행 전체 조회 (`select`로 필드 축소는 이후 필요 시 도입)

2. Design 타입 정리 (`src/entities/design/design.api.ts`)
   - Prisma 생성 타입 `Design`을 API 파일에서 직접 사용 (초기 단계 단순화)

3. 도안 카드 UI 생성 (`src/entities/design/ui/DesignCard.tsx`)
   - 대표 이미지(`images` 배열의 첫 요소), 제목, 카테고리 렌더링
   - 카드 전체 클릭 시 `/designs/[id]`로 이동
   - 이미지가 없으면 플레이스홀더 표시

4. 홈 페이지 구성 (`src/app/page.tsx`)
   - 서버 컴포넌트에서 `getDesigns()` 호출
   - `DesignCard` 목록 렌더링
   - 페이지 상단 제목/설명 배치

5. Public API 정리
   - `src/entities/design/index.ts`에서 외부 노출 심볼 export
   - 외부에서는 세그먼트 내부 경로 직접 import 금지

---

## 구현 지침

- **서버 컴포넌트 우선**: 목록 조회는 서버에서 수행하고 결과만 렌더링한다. 클라이언트 fetch로 초기 렌더를 대체하지 않는다.

- **N+1 방지**: 목록은 단일 `findMany`로 조회하고, 카드마다 추가 쿼리를 하지 않는다.

- **정렬 일관성**: 최신순 기준 컬럼을 `createdAt`으로 고정한다.

- **빈 상태 UX 제공**: 등록된 도안이 없을 때 빈 화면 대신 안내 문구를 노출한다.

- **FSD 레이어 준수**: 도메인 UI(`DesignCard`)와 목록 조회 로직은 `entities/design/`에 배치한다.

---

## 엣지 케이스

---

## 검증 항목
